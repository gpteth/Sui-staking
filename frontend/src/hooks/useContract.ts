import { useEffect, useState } from 'react';
import { SuiClient } from '@mysten/sui.js/client';
import { StakingContract } from '../lib/contracts/staking';
import { LiquidityPoolContract } from '../lib/contracts/liquidity';
import { RPC_URL } from '../lib/constants';
import { useSuiClient } from '@mysten/dapp-kit';

export function useContract() {
    const client = useSuiClient();
    const [stakingContract, setStakingContract] = useState<StakingContract | null>(null);
    const [liquidityContract, setLiquidityContract] = useState<LiquidityPoolContract | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeContracts = async () => {
            try {
                setLoading(true);

                // 初始化合约实例
                const staking = new StakingContract(client);
                const liquidity = new LiquidityPoolContract(client);

                setStakingContract(staking);
                setLiquidityContract(liquidity);
                setError(null);
            } catch (err) {
                console.error('初始化合约失败:', err);
                setError('初始化合约失败');
            } finally {
                setLoading(false);
            }
        };

        initializeContracts();
    }, [client]);

    return {
        client,
        stakingContract,
        liquidityContract,
        loading,
        error
    };
} 