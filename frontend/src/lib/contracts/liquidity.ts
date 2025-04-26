import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';
import { LIQUIDITY_PACKAGE_ID } from '../constants';

export class LiquidityPoolContract {
    constructor(
        private client: SuiClient,
        private packageId: string = LIQUIDITY_PACKAGE_ID
    ) {}

    // 获取流动性池信息
    async getPoolInfo(poolId: string) {
        try {
            const pool = await this.client.getObject({
                id: poolId,
                options: { showContent: true }
            });
            return pool;
        } catch (error) {
            console.error('获取流动性池信息失败:', error);
            throw error;
        }
    }

    // 添加流动性
    async addLiquidity(
        poolId: string,
        farmAmount: bigint,
        suiAmount: bigint,
        minLpTokens: bigint,
        signer: string
    ) {
        try {
            const tx = new TransactionBlock();
            
            // 创建代币支付对象
            const farmCoin = tx.splitCoins(tx.gas, [tx.pure(farmAmount)]);
            const suiCoin = tx.splitCoins(tx.gas, [tx.pure(suiAmount)]);
            
            // 调用添加流动性函数
            tx.moveCall({
                target: `${this.packageId}::liquidity_pool::add_liquidity`,
                arguments: [
                    tx.object(poolId), // pool
                    farmCoin, // farm_coins
                    suiCoin, // sui_coins
                    tx.pure(minLpTokens), // min_lp_tokens
                    tx.object('0x6'), // clock
                ],
            });

            return await this.client.signAndExecuteTransactionBlock({
                signer,
                transactionBlock: tx,
            });
        } catch (error) {
            console.error('添加流动性失败:', error);
            throw error;
        }
    }

    // 移除流动性
    async removeLiquidity(
        poolId: string,
        lpAmount: bigint,
        minFarmOut: bigint,
        minSuiOut: bigint,
        signer: string
    ) {
        try {
            const tx = new TransactionBlock();
            
            // 创建 LP 代币支付对象
            const lpCoin = tx.splitCoins(tx.gas, [tx.pure(lpAmount)]);
            
            tx.moveCall({
                target: `${this.packageId}::liquidity_pool::remove_liquidity`,
                arguments: [
                    tx.object(poolId), // pool
                    lpCoin, // lp_coins
                    tx.pure(minFarmOut), // min_farm_out
                    tx.pure(minSuiOut), // min_sui_out
                ],
            });

            return await this.client.signAndExecuteTransactionBlock({
                signer,
                transactionBlock: tx,
            });
        } catch (error) {
            console.error('移除流动性失败:', error);
            throw error;
        }
    }

    // Farm 换 SUI
    async swapFarmToSui(
        poolId: string,
        farmAmount: bigint,
        minSuiOut: bigint,
        signer: string
    ) {
        try {
            const tx = new TransactionBlock();
            
            const farmCoin = tx.splitCoins(tx.gas, [tx.pure(farmAmount)]);
            
            tx.moveCall({
                target: `${this.packageId}::liquidity_pool::swap_farm_to_sui`,
                arguments: [
                    tx.object(poolId), // pool
                    farmCoin, // farm_coins
                    tx.pure(minSuiOut), // min_sui_out
                ],
            });

            return await this.client.signAndExecuteTransactionBlock({
                signer,
                transactionBlock: tx,
            });
        } catch (error) {
            console.error('交换失败:', error);
            throw error;
        }
    }

    // SUI 换 Farm
    async swapSuiToFarm(
        poolId: string,
        suiAmount: bigint,
        minFarmOut: bigint,
        signer: string
    ) {
        try {
            const tx = new TransactionBlock();
            
            const suiCoin = tx.splitCoins(tx.gas, [tx.pure(suiAmount)]);
            
            tx.moveCall({
                target: `${this.packageId}::liquidity_pool::swap_sui_to_farm`,
                arguments: [
                    tx.object(poolId), // pool
                    suiCoin, // sui_coins
                    tx.pure(minFarmOut), // min_farm_out
                ],
            });

            return await this.client.signAndExecuteTransactionBlock({
                signer,
                transactionBlock: tx,
            });
        } catch (error) {
            console.error('交换失败:', error);
            throw error;
        }
    }

    // 获取用户 LP 代币余额
    async getUserLPBalance(address: string) {
        try {
            const objects = await this.client.getOwnedObjects({
                owner: address,
                filter: {
                    StructType: `${this.packageId}::liquidity_pool::LP_TOKEN`
                },
                options: { showContent: true }
            });
            return objects;
        } catch (error) {
            console.error('获取用户 LP 代币余额失败:', error);
            throw error;
        }
    }

    // 计算添加流动性会得到的 LP 代币数量
    async calculateLPTokens(
        poolId: string,
        farmAmount: bigint,
        suiAmount: bigint
    ) {
        try {
            const pool = await this.getPoolInfo(poolId);
            const poolData = pool.data?.content as any;
            
            if (!poolData) {
                throw new Error('无法获取池子数据');
            }

            const totalSupply = poolData.lp_supply;
            const farmReserve = poolData.farm_balance;
            const suiReserve = poolData.sui_balance;

            if (totalSupply === '0') {
                return Math.sqrt(Number(farmAmount) * Number(suiAmount));
            }

            const farmRatio = (Number(farmAmount) * 1000) / Number(farmReserve);
            const suiRatio = (Number(suiAmount) * 1000) / Number(suiReserve);
            const minRatio = Math.min(farmRatio, suiRatio);

            return (Number(totalSupply) * minRatio) / 1000;
        } catch (error) {
            console.error('计算 LP 代币数量失败:', error);
            throw error;
        }
    }

    // 计算移除流动性会得到的代币数量
    async calculateRemoveLiquidity(
        poolId: string,
        lpAmount: bigint
    ) {
        try {
            const pool = await this.getPoolInfo(poolId);
            const poolData = pool.data?.content as any;
            
            if (!poolData) {
                throw new Error('无法获取池子数据');
            }

            const totalSupply = poolData.lp_supply;
            const farmReserve = poolData.farm_balance;
            const suiReserve = poolData.sui_balance;

            const farmAmount = (Number(lpAmount) * Number(farmReserve)) / Number(totalSupply);
            const suiAmount = (Number(lpAmount) * Number(suiReserve)) / Number(totalSupply);

            return {
                farmAmount,
                suiAmount
            };
        } catch (error) {
            console.error('计算移除流动性数量失败:', error);
            throw error;
        }
    }

    // 计算交换得到的代币数量
    async calculateSwapOutput(
        poolId: string,
        inputAmount: bigint,
        isFarmToSui: boolean
    ) {
        try {
            const pool = await this.getPoolInfo(poolId);
            const poolData = pool.data?.content as any;
            
            if (!poolData) {
                throw new Error('无法获取池子数据');
            }

            const farmReserve = Number(poolData.farm_balance);
            const suiReserve = Number(poolData.sui_balance);
            const feePercent = Number(poolData.fee_percent);

            const inputWithFee = Number(inputAmount) * (10000 - feePercent) / 10000;
            
            if (isFarmToSui) {
                return (inputWithFee * suiReserve) / (farmReserve + inputWithFee);
            } else {
                return (inputWithFee * farmReserve) / (suiReserve + inputWithFee);
            }
        } catch (error) {
            console.error('计算交换输出数量失败:', error);
            throw error;
        }
    }
} 