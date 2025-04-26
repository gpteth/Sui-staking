import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { formatUnits } from '../utils/format';
import { DECIMALS, STAKING_PACKAGE_ID } from '../lib/constants';
import { SuiTransactionBlockResponse, SuiEvent } from '@mysten/sui.js/client';

interface Transaction extends SuiTransactionBlockResponse {
    timestamp_ms: number | null;
}

interface StakingEventData {
    user: string;
    amount: string;
    reward?: string;
}

export function TransactionHistory() {
    const account = useCurrentAccount();
    const client = useSuiClient();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTransactions = async () => {
            if (!account) return;

            try {
                setLoading(true);
                const { data } = await client.queryTransactionBlocks({
                    filter: {
                        FromAddress: account.address
                    },
                    options: {
                        showEvents: true,
                        showInput: true,
                    },
                    limit: 20
                });

                const transactionsWithTimestamp = data.map(tx => ({
                    ...tx,
                    timestamp_ms: null
                }));

                setTransactions(transactionsWithTimestamp as Transaction[]);
            } catch (error) {
                console.error('加载交易记录失败:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTransactions();
    }, [account, client]);

    const getEventType = (type: string) => {
        const eventTypes: Record<string, string> = {
            [`${STAKING_PACKAGE_ID}::vault::Staked`]: '质押',
            [`${STAKING_PACKAGE_ID}::vault::Withdrawn`]: '解除质押',
            [`${STAKING_PACKAGE_ID}::vault::RewardPaid`]: '领取奖励'
        };
        return eventTypes[type] || '其他操作';
    };

    const formatTime = (timestamp: number | null) => {
        if (!timestamp) return '未知时间';
        return new Date(timestamp).toLocaleString('zh-CN');
    };

    if (loading) return <div className="text-center py-4">加载交易记录中...</div>;
    if (!account) return null;

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">交易记录</h3>
            <div className="space-y-4">
                {transactions.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">暂无交易记录</div>
                ) : (
                    transactions.map(tx => {
                        const events = (tx.effects?.events || []) as SuiEvent[];
                        const stakingEvents = events.filter((event: SuiEvent) => 
                            event.type.startsWith(STAKING_PACKAGE_ID)
                        );

                        if (stakingEvents.length === 0) return null;

                        return stakingEvents.map((event: SuiEvent, index: number) => {
                            const parsedJson = event.parsedJson as StakingEventData | undefined;
                            
                            return (
                                <div key={`${tx.digest}-${index}`} className="bg-white p-4 rounded-lg shadow border border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="font-medium">{getEventType(event.type)}</span>
                                            {parsedJson && (
                                                <div className="mt-1 text-sm text-gray-600">
                                                    {parsedJson.amount && (
                                                        <div>数量: {formatUnits(parsedJson.amount, DECIMALS)} FARM</div>
                                                    )}
                                                    {parsedJson.reward && (
                                                        <div>奖励: {formatUnits(parsedJson.reward, DECIMALS)} FARM</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {formatTime(tx.timestamp_ms)}
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400 break-all">
                                        交易ID: {tx.digest}
                                    </div>
                                </div>
                            );
                        });
                    })
                )}
            </div>
        </div>
    );
} 