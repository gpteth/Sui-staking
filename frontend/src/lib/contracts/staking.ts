import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui.js/client';
import { STAKING_PACKAGE_ID, TREASURY_ID, USER_STATE_ID, REWARD_STATE_ID, FARM_TOKEN_TYPE } from '../../lib/constants';

export class StakingContract {
    constructor(
        private client: SuiClient
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
        
        // 获取用户的代币
        const coins = await this.getFarmTokens(address);
        if (!coins.data || coins.data.length === 0) {
            throw new Error('没有找到FARM代币');
        }

        // 合并所有代币
        const [primaryCoin, ...mergeCoins] = coins.data;
        if (mergeCoins.length > 0) {
            tx.mergeCoins(
                tx.object(primaryCoin.coinObjectId),
                mergeCoins.map(coin => tx.object(coin.coinObjectId))
            );
        }

        // 如果金额小于代币总额，需要拆分
        const totalBalance = BigInt(primaryCoin.balance);
        if (amount < totalBalance) {
            const [stakingCoin] = tx.splitCoins(tx.object(primaryCoin.coinObjectId), [tx.pure(amount)]);
            
            tx.moveCall({
                target: `${STAKING_PACKAGE_ID}::vault::stake`,
                arguments: [
                    tx.object(TREASURY_ID),
                    tx.object(USER_STATE_ID),
                    tx.object(REWARD_STATE_ID),
                    stakingCoin
                ],
                typeArguments: [FARM_TOKEN_TYPE]
            });
        } else {
            tx.moveCall({
                target: `${STAKING_PACKAGE_ID}::vault::stake`,
                arguments: [
                    tx.object(TREASURY_ID),
                    tx.object(USER_STATE_ID),
                    tx.object(REWARD_STATE_ID),
                    tx.object(primaryCoin.coinObjectId)
                ],
                typeArguments: [FARM_TOKEN_TYPE]
            });
        }

        return tx.serialize();
    }

    // 创建解除质押交易
    createUnstakeTransaction(amount: bigint): string {
        const tx = new TransactionBlock();
        
        tx.moveCall({
            target: `${STAKING_PACKAGE_ID}::vault::unstake`,
            arguments: [
                tx.object(TREASURY_ID),
                tx.object(USER_STATE_ID),
                tx.object(REWARD_STATE_ID),
                tx.pure(amount)
            ],
            typeArguments: [FARM_TOKEN_TYPE]
        });

        return tx.serialize();
    }

    // 创建领取奖励交易
    createClaimRewardTransaction(): string {
        const tx = new TransactionBlock();
        
        tx.moveCall({
            target: `${STAKING_PACKAGE_ID}::vault::claim_reward`,
            arguments: [
                tx.object(TREASURY_ID),
                tx.object(USER_STATE_ID),
                tx.object(REWARD_STATE_ID)
            ],
            typeArguments: [FARM_TOKEN_TYPE]
        });

        return tx.serialize();
    }

    // 获取用户质押信息
    async getUserStakeInfo(address: string) {
        try {
            const objects = await this.client.getOwnedObjects({
                owner: address,
                filter: {
                    StructType: `${STAKING_PACKAGE_ID}::vault::StakeInfo`
                },
                options: { showContent: true }
            });
            return objects;
        } catch (error) {
            console.error('获取用户质押信息失败:', error);
            throw error;
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
} 