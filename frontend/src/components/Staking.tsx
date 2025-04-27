import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { SuiTransactionBlockResponse } from '@mysten/sui.js/client';
import { useContract } from '../hooks/useContract';
import { formatUnits, parseUnits } from '../utils/format';
import { DECIMALS, ERROR_MESSAGES, EXPLORER_URL } from '../lib/constants';

export function Staking() {
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const client = useSuiClient();
    const { stakingContract, loading, error } = useContract();
    
    const [stakeAmount, setStakeAmount] = useState('');
    const [mintAmount, setMintAmount] = useState('');
    const [userStakeInfo, setUserStakeInfo] = useState<any>(null);
    const [suiBalance, setSuiBalance] = useState<string>('0');
    const [processing, setProcessing] = useState(false);
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Array<{
        type: string;
        hash: string;
        timestamp: number;
    }>>([]);

    // 加载用户质押信息
    useEffect(() => {
        const loadUserInfo = async () => {
            if (!currentAccount || !stakingContract) return;

            try {
                const stakeInfo = await stakingContract.getUserStakeInfo(currentAccount.address);
                setUserStakeInfo(stakeInfo);

                // 获取 SUI 余额
                const { data: coins } = await client.getCoins({
                    owner: currentAccount.address,
                    coinType: '0x2::sui::SUI'
                });

                const totalBalance = coins.reduce((acc: bigint, coin: { balance: string }) => 
                    acc + BigInt(coin.balance), 0n);
                setSuiBalance(totalBalance.toString());
            } catch (err) {
                console.error('加载用户信息失败:', err);
                setUserStakeInfo(null);
            }
        };

        loadUserInfo();
        // 每10秒刷新一次用户信息
        const interval = setInterval(loadUserInfo, 10000);
        return () => clearInterval(interval);
    }, [currentAccount, stakingContract, client]);

    // 质押代币
    const handleStake = async () => {
        if (!currentAccount || !stakingContract) {
            setTransactionError('请先连接钱包');
            return;
        }

        try {
            setProcessing(true);
            setTransactionError(null);

            const amount = parseUnits(stakeAmount, DECIMALS);
            const tx = await stakingContract.createStakeTransaction(currentAccount.address, amount);
            
            await signAndExecute(
                {
                    transaction: tx,
                    chain: 'sui:testnet',
                },
                {
                    onSuccess: async (result) => {
                        setTransactions(prev => [{
                            type: '质押',
                            hash: result.digest,
                            timestamp: Date.now()
                        }, ...prev.slice(0, 9)]);

                        setStakeAmount('');
                        const stakeInfo = await stakingContract.getUserStakeInfo(currentAccount.address);
                        setUserStakeInfo(stakeInfo);
                    },
                }
            );
        } catch (err) {
            console.error('质押失败:', err);
            setTransactionError(ERROR_MESSAGES.TRANSACTION_FAILED);
        } finally {
            setProcessing(false);
        }
    };

    // 解除质押
    const handleUnstake = async (amount: string) => {
        if (!currentAccount || !stakingContract || !userStakeInfo) {
            setTransactionError('请先连接钱包');
            return;
        }

        try {
            setProcessing(true);
            setTransactionError(null);

            const unstakeAmount = parseUnits(amount, DECIMALS);
            const tx = stakingContract.createUnstakeTransaction(unstakeAmount);
            
            await signAndExecute(
                {
                    transaction: tx,
                    chain: 'sui:testnet',
                },
                {
                    onSuccess: async (result) => {
                        setTransactions(prev => [{
                            type: '解除质押',
                            hash: result.digest,
                            timestamp: Date.now()
                        }, ...prev.slice(0, 9)]);

                        const stakeInfo = await stakingContract.getUserStakeInfo(currentAccount.address);
                        setUserStakeInfo(stakeInfo);
                    },
                }
            );
        } catch (err) {
            console.error('解除质押失败:', err);
            setTransactionError(ERROR_MESSAGES.TRANSACTION_FAILED);
        } finally {
            setProcessing(false);
        }
    };

    // 领取奖励
    const handleClaimReward = async () => {
        if (!currentAccount || !stakingContract || !userStakeInfo) {
            setTransactionError('请先连接钱包');
            return;
        }

        try {
            setProcessing(true);
            setTransactionError(null);

            const tx = stakingContract.createClaimRewardTransaction();
            
            await signAndExecute(
                {
                    transaction: tx,
                    chain: 'sui:testnet',
                },
                {
                    onSuccess: async (result) => {
                        setTransactions(prev => [{
                            type: '领取奖励',
                            hash: result.digest,
                            timestamp: Date.now()
                        }, ...prev.slice(0, 9)]);

                        const stakeInfo = await stakingContract.getUserStakeInfo(currentAccount.address);
                        setUserStakeInfo(stakeInfo);
                    },
                }
            );
        } catch (err) {
            console.error('领取奖励失败:', err);
            setTransactionError(ERROR_MESSAGES.TRANSACTION_FAILED);
        } finally {
            setProcessing(false);
        }
    };

    // 铸造代币
    const handleMint = async () => {
        if (!currentAccount || !stakingContract) {
            setTransactionError('请先连接钱包');
            return;
        }

        try {
            setProcessing(true);
            setTransactionError(null);

            const amount = parseUnits(mintAmount, DECIMALS);
            const tx = await stakingContract.createMintTransaction(amount, currentAccount.address);
            
            await signAndExecute(
                {
                    transaction: tx,
                    chain: 'sui:testnet',
                },
                {
                    onSuccess: async (result) => {
                        setTransactions(prev => [{
                            type: '铸造',
                            hash: result.digest,
                            timestamp: Date.now()
                        }, ...prev.slice(0, 9)]);

                        setMintAmount('');
                        const stakeInfo = await stakingContract.getUserStakeInfo(currentAccount.address);
                        setUserStakeInfo(stakeInfo);
                    },
                }
            );
        } catch (err) {
            console.error('铸造失败:', err);
            setTransactionError(ERROR_MESSAGES.TRANSACTION_FAILED);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div>加载中...</div>;
    if (error) return <div>错误: {error}</div>;
    if (!currentAccount) return <div>请连接钱包</div>;

    return (
        <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">质押 SUI 代币</h2>
            
            {/* SUI 余额 */}
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg border-2 border-blue-400 shadow-lg">
                <h3 className="text-lg font-semibold mb-3 text-white">您的 SUI 余额</h3>
                <div className="flex items-baseline">
                    <p className="text-3xl font-bold text-white">{formatUnits(suiBalance, DECIMALS)}</p>
                    <p className="ml-2 text-xl text-blue-100">SUI</p>
                </div>
            </div>

            {/* 质押信息 */}
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg border-2 border-purple-400 shadow-lg">
                <h3 className="text-lg font-semibold mb-3 text-white">您的质押信息</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white bg-opacity-10 rounded-lg p-4">
                        <p className="text-purple-100 mb-1">质押数量</p>
                        <div className="flex items-baseline">
                            <p className="text-2xl font-bold text-white">{formatUnits(userStakeInfo?.amount || '0', DECIMALS)}</p>
                            <p className="ml-2 text-purple-100">SUI</p>
                        </div>
                    </div>
                    <div className="bg-white bg-opacity-10 rounded-lg p-4">
                        <p className="text-purple-100 mb-1">可领取奖励</p>
                        <div className="flex items-baseline">
                            <p className="text-2xl font-bold text-white">{formatUnits(userStakeInfo?.reward || '0', DECIMALS)}</p>
                            <p className="ml-2 text-purple-100">FARM</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 质押表单 */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">质押代币</h3>
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="number"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            placeholder="输入质押数量"
                            className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg font-medium text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            disabled={processing}
                        />
                        <button
                            onClick={() => setStakeAmount(formatUnits(suiBalance, DECIMALS))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-sm text-blue-600 hover:text-blue-700"
                            type="button"
                        >
                            最大
                        </button>
                    </div>
                    <button
                        onClick={handleStake}
                        disabled={processing || !stakeAmount || BigInt(parseUnits(stakeAmount, DECIMALS)) > BigInt(suiBalance)}
                        className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-lg transition-all shadow-lg hover:shadow-xl"
                    >
                        {processing ? '处理中...' : '质押'}
                    </button>
                </div>
            </div>

            {/* 铸造表单 */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">铸造代币</h3>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <input
                            type="number"
                            value={mintAmount}
                            onChange={(e) => setMintAmount(e.target.value)}
                            placeholder="输入铸造数量"
                            className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg font-medium text-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                            disabled={processing}
                        />
                    </div>
                    <button
                        onClick={handleMint}
                        disabled={processing || !mintAmount}
                        className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-lg transition-all shadow-lg hover:shadow-xl"
                    >
                        {processing ? '处理中...' : '铸造'}
                    </button>
                </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => handleUnstake(userStakeInfo?.amount || '0')}
                    disabled={processing || !userStakeInfo?.amount || userStakeInfo.amount === '0'}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 font-medium text-lg transition-all shadow-lg hover:shadow-xl"
                >
                    {processing ? '处理中...' : '解除质押'}
                </button>
                <button
                    onClick={handleClaimReward}
                    disabled={processing || !userStakeInfo?.reward || userStakeInfo.reward === '0'}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 font-medium text-lg transition-all shadow-lg hover:shadow-xl"
                >
                    {processing ? '处理中...' : '领取奖励'}
                </button>
            </div>

            {/* 错误提示 */}
            {transactionError && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg font-medium animate-pulse">
                    {transactionError}
                </div>
            )}

            {/* 交易记录 */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">最近交易记录</h3>
                <div className="space-y-2">
                    {transactions.map((tx, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-100 rounded">
                            <div>
                                <span className="font-medium">{tx.type}</span>
                                <span className="text-gray-500 ml-2">
                                    {new Date(tx.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <a
                                href={`${EXPLORER_URL}${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                            >
                                查看交易
                            </a>
                        </div>
                    ))}
                    {transactions.length === 0 && (
                        <div className="text-center text-gray-500">
                            暂无交易记录
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 