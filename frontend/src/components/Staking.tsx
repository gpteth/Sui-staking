import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useContract } from '../hooks/useContract';
import { formatUnits, parseUnits } from '../utils/format';
import { DECIMALS, ERROR_MESSAGES, USER_STATE_ID, REWARD_STATE_ID } from '../lib/constants';
import { TransactionHistory } from './TransactionHistory';

export function Staking() {
    const account = useCurrentAccount();
    const { stakingContract, loading, error } = useContract();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    
    const [stakeAmount, setStakeAmount] = useState('');
    const [mintAmount, setMintAmount] = useState('');
    const [userStakeInfo, setUserStakeInfo] = useState<any>(null);
    const [poolInfo, setPoolInfo] = useState<any>({
        id: USER_STATE_ID
    });
    const [processing, setProcessing] = useState(false);
    const [transactionError, setTransactionError] = useState<string | null>(null);

    // 加载用户质押信息
    useEffect(() => {
        const loadUserInfo = async () => {
            if (!account || !stakingContract) return;

            try {
                const stakeInfo = await stakingContract.getUserStakeInfo(account.address);
                setUserStakeInfo(stakeInfo);
            } catch (err) {
                console.error('加载用户质押信息失败:', err);
            }
        };

        loadUserInfo();
    }, [account, stakingContract]);

    // 加载池子信息
    useEffect(() => {
        const loadPoolInfo = async () => {
            if (!stakingContract) return;

            try {
                const userState = await stakingContract.getUserState();
                const rewardState = await stakingContract.getRewardState();
                setPoolInfo({
                    id: USER_STATE_ID,
                    userState,
                    rewardState
                });
            } catch (err) {
                console.error('加载池子信息失败:', err);
            }
        };

        loadPoolInfo();
        const interval = setInterval(loadPoolInfo, 10000);
        return () => clearInterval(interval);
    }, [stakingContract]);

    // 质押代币
    const handleStake = async () => {
        if (!account || !stakingContract) {
            setTransactionError('请先连接钱包');
            return;
        }

        try {
            setProcessing(true);
            setTransactionError(null);

            const amount = parseUnits(stakeAmount, DECIMALS);
            const tx = await stakingContract.createStakeTransaction(account.address, amount);
            
            await signAndExecute({
                transaction: tx
            });

            setStakeAmount('');
            // 重新加载用户信息
            const stakeInfo = await stakingContract.getUserStakeInfo(account.address);
            setUserStakeInfo(stakeInfo);
        } catch (err: any) {
            console.error('质押失败:', err);
            setTransactionError(err.message || ERROR_MESSAGES.TRANSACTION_FAILED);
        } finally {
            setProcessing(false);
        }
    };

    // 解除质押
    const handleUnstake = async (amount: string) => {
        if (!account || !stakingContract || !userStakeInfo) {
            setTransactionError('请先连接钱包');
            return;
        }

        try {
            setProcessing(true);
            setTransactionError(null);

            const unstakeAmount = parseUnits(amount, DECIMALS);
            const tx = stakingContract.createUnstakeTransaction(unstakeAmount);
            
            await signAndExecute({
                transaction: tx
            });

            // 重新加载用户信息
            const stakeInfo = await stakingContract.getUserStakeInfo(account.address);
            setUserStakeInfo(stakeInfo);
        } catch (err) {
            console.error('解除质押失败:', err);
            setTransactionError(ERROR_MESSAGES.TRANSACTION_FAILED);
        } finally {
            setProcessing(false);
        }
    };

    // 领取奖励
    const handleClaimReward = async () => {
        if (!account || !stakingContract || !userStakeInfo) {
            setTransactionError('请先连接钱包');
            return;
        }

        try {
            setProcessing(true);
            setTransactionError(null);

            const tx = stakingContract.createClaimRewardTransaction();
            
            await signAndExecute({
                transaction: tx
            });

            // 重新加载用户信息
            const stakeInfo = await stakingContract.getUserStakeInfo(account.address);
            setUserStakeInfo(stakeInfo);
        } catch (err) {
            console.error('领取奖励失败:', err);
            setTransactionError(ERROR_MESSAGES.TRANSACTION_FAILED);
        } finally {
            setProcessing(false);
        }
    };

    // 铸造代币
    const handleMint = async () => {
        if (!account || !stakingContract) {
            setTransactionError('请先连接钱包');
            return;
        }

        try {
            setProcessing(true);
            setTransactionError(null);

            const amount = parseUnits(mintAmount, DECIMALS);
            const tx = await stakingContract.createMintTransaction(amount, account.address);
            
            await signAndExecute({
                transaction: tx
            });

            setMintAmount('');
            // 重新加载用户信息
            const stakeInfo = await stakingContract.getUserStakeInfo(account.address);
            setUserStakeInfo(stakeInfo);
        } catch (err: any) {
            console.error('铸造失败:', err);
            setTransactionError(err.message || ERROR_MESSAGES.TRANSACTION_FAILED);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div>加载中...</div>;
    if (error) return <div>错误: {error}</div>;
    if (!account) return <div>请连接钱包</div>;

    return (
        <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-6">质押 FARM 代币</h2>
            
            {/* 铸造表单 */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">铸造代币</h3>
                <div className="flex items-center gap-4">
                    <input
                        type="number"
                        value={mintAmount}
                        onChange={(e) => setMintAmount(e.target.value)}
                        placeholder="输入铸造数量"
                        className="flex-1 p-3 border-2 border-gray-300 rounded-lg text-lg font-medium text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                        disabled={processing}
                    />
                    <button
                        onClick={handleMint}
                        disabled={processing || !mintAmount}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium text-lg transition-all"
                    >
                        {processing ? '处理中...' : '铸造'}
                    </button>
                </div>
            </div>

            {/* 质押信息 */}
            {userStakeInfo && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <h3 className="text-lg font-semibold mb-2">您的质押信息</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-600">质押数量</p>
                            <p className="font-medium text-lg">{formatUnits(userStakeInfo.amount, DECIMALS)} FARM</p>
                        </div>
                        <div>
                            <p className="text-gray-600">可领取奖励</p>
                            <p className="font-medium text-lg">{formatUnits(userStakeInfo.reward, DECIMALS)} FARM</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 质押表单 */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">质押代币</h3>
                <div className="flex items-center gap-4">
                    <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="输入质押数量"
                        className="flex-1 p-3 border-2 border-gray-300 rounded-lg text-lg font-medium text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        disabled={processing}
                    />
                    <button
                        onClick={handleStake}
                        disabled={processing || !stakeAmount}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-lg transition-all"
                    >
                        {processing ? '处理中...' : '质押'}
                    </button>
                </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4">
                <button
                    onClick={() => handleUnstake(userStakeInfo?.amount || '0')}
                    disabled={processing || !userStakeInfo?.amount}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-lg transition-all"
                >
                    {processing ? '处理中...' : '解除质押'}
                </button>
                <button
                    onClick={handleClaimReward}
                    disabled={processing || !userStakeInfo?.reward}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-lg transition-all"
                >
                    {processing ? '处理中...' : '领取奖励'}
                </button>
            </div>

            {/* 错误提示 */}
            {transactionError && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg font-medium">
                    {transactionError}
                </div>
            )}

            {/* 交易记录 */}
            <TransactionHistory />
        </div>
    );
} 