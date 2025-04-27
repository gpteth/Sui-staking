import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';
import { STAKING_PACKAGE_ID, TREASURY_ID, USER_STATE_ID, REWARD_STATE_ID, FARM_TOKEN_TYPE, TREASURY_CAP_ID, SUI_CLOCK_OBJECT_ID, DEFAULT_GAS_BUDGET } from '../constants';

export class StakingContract {
    constructor(
        public readonly client: SuiClient
    ) {}

    // 获取质押池信息
    async getPoolInfo(poolId: string) {
        try {
            const pool = await this.client.getObject({
                id: poolId,
                options: { showContent: true }
            });
            return pool;
        } catch (error) {
            console.error('获取质押池信息失败:', error);
            throw error;
        }
    }

    // 获取用户的代币对象
    async getFarmTokens(address: string) {
        try {
            const coins = await this.client.getCoins({
                owner: address,
                coinType: FARM_TOKEN_TYPE
            });
            return coins;
        } catch (error) {
            console.error('获取代币失败:', error);
            throw error;
        }
    }

    // 创建质押交易
    async createStakeTransaction(address: string, amount: bigint): Promise<string> {
        const tx = new TransactionBlock();
        
        // 设置合理的 gas 预算
        tx.setGasBudget(DEFAULT_GAS_BUDGET);

        // 获取用户的 FARM 代币
        const { data: coins } = await this.client.getCoins({
            owner: address,
            coinType: FARM_TOKEN_TYPE
        });
        
        if (!coins || coins.length === 0) {
            throw new Error('没有找到 FARM 代币');
        }

        // 找到一个用于质押的代币
        const stakingCoin = coins[0];
        const totalBalance = BigInt(stakingCoin.balance);

        if (totalBalance < amount) {
            throw new Error('FARM 代币余额不足');
        }

        // 如果金额小于代币总额，需要拆分
        if (amount < totalBalance) {
            const [splitCoin] = tx.splitCoins(tx.object(stakingCoin.coinObjectId), [tx.pure(amount)]);
            
            tx.moveCall({
                target: `${STAKING_PACKAGE_ID}::staking::stake`,
                arguments: [
                    tx.object(TREASURY_ID),       // pool
                    splitCoin,                    // farm_coins
                    tx.object(SUI_CLOCK_OBJECT_ID), // clock
                ],
                typeArguments: []
            });
        } else {
            tx.moveCall({
                target: `${STAKING_PACKAGE_ID}::staking::stake`,
                arguments: [
                    tx.object(TREASURY_ID),       // pool
                    tx.object(stakingCoin.coinObjectId), // farm_coins
                    tx.object(SUI_CLOCK_OBJECT_ID), // clock
                ],
                typeArguments: []
            });
        }

        return tx.serialize();
    }

    // 创建解除质押交易
    createUnstakeTransaction(amount: bigint): string {
        const tx = new TransactionBlock();
        
        // 设置合理的 gas 预算
        tx.setGasBudget(DEFAULT_GAS_BUDGET);

        tx.moveCall({
            target: `${STAKING_PACKAGE_ID}::staking::unstake`,
            arguments: [
                tx.object(TREASURY_ID),      // pool
                tx.pure(amount),             // amount
                tx.object(SUI_CLOCK_OBJECT_ID), // clock
            ],
            typeArguments: []
        });

        return tx.serialize();
    }

    // 创建领取奖励交易
    createClaimRewardTransaction(): string {
        const tx = new TransactionBlock();
        
        // 设置合理的 gas 预算
        tx.setGasBudget(DEFAULT_GAS_BUDGET);

        tx.moveCall({
            target: `${STAKING_PACKAGE_ID}::staking::claim_reward`,
            arguments: [
                tx.object(TREASURY_ID),         // pool
                tx.object(SUI_CLOCK_OBJECT_ID)  // clock
            ],
            typeArguments: []
        });

        return tx.serialize();
    }

    // 获取用户质押信息
    async getUserStakeInfo(address: string) {
        try {
            const userState = await this.getUserState();
            if (!userState.data?.content) {
                throw new Error('无法获取用户状态');
            }

            // 将内容转换为正确的类型
            const content = userState.data.content as unknown as {
                fields: {
                    balanceOf: {
                        type: string;
                        fields: {
                            contents: Array<{
                                fields: {
                                    key: string;
                                    value: string;
                                }
                            }>
                        }
                    },
                    rewards: {
                        type: string;
                        fields: {
                            contents: Array<{
                                fields: {
                                    key: string;
                                    value: string;
                                }
                            }>
                        }
                    }
                }
            };

            // 从 VecMap 中获取用户数据
            const balanceOf = content.fields.balanceOf.fields.contents;
            const rewards = content.fields.rewards.fields.contents;

            // 查找用户的数据
            const userBalance = balanceOf.find(item => item.fields.key === address)?.fields.value || '0';
            const userReward = rewards.find(item => item.fields.key === address)?.fields.value || '0';

            console.log('用户质押信息:', { userBalance, userReward }); // 添加日志

            return {
                amount: userBalance,
                reward: userReward
            };
        } catch (error) {
            console.error('获取用户质押信息失败:', error);
            return {
                amount: '0',
                reward: '0'
            };
        }
    }

    async getUserState() {
        const userState = await this.client.getObject({
            id: USER_STATE_ID,
            options: {
                showContent: true
            }
        });
        return userState;
    }

    async getRewardState() {
        const rewardState = await this.client.getObject({
            id: REWARD_STATE_ID,
            options: {
                showContent: true
            }
        });
        return rewardState;
    }

    // 铸造代币
    async createMintTransaction(amount: bigint, recipient: string): Promise<string> {
        const tx = new TransactionBlock();
        
        // 设置合理的 gas 预算
        tx.setGasBudget(DEFAULT_GAS_BUDGET);

        tx.moveCall({
            target: `${STAKING_PACKAGE_ID}::farm::mint`,
            arguments: [
                tx.object(TREASURY_CAP_ID), // treasury_cap
                tx.pure(amount),            // amount
                tx.pure(recipient)          // recipient
            ],
            typeArguments: []
        });

        return tx.serialize();
    }
} 