module farm::staking {
    use sui::object::{Self, UID};
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use sui::event;
    use farm::farm_token::FARM_TOKEN;

    /// 质押池结构体
    public struct STAKING has drop {}

    public struct StakingPool has key {
        id: UID,
        staked_balance: Balance<FARM_TOKEN>,
        reward_balance: Balance<FARM_TOKEN>,
        total_staked: u64,
        reward_rate: u64,
        last_update_time: u64,
        minimum_stake_amount: u64,
        maximum_stake_amount: u64,
        enabled: bool
    }

    /// 质押信息结构体
    public struct StakeInfo has key {
        id: UID,
        owner: address,
        amount: u64,
        reward_debt: u64,
        last_stake_time: u64,
        unlock_time: u64
    }

    // 管理员权限结构体
    public struct AdminCap has key {
        id: UID
    }

    /// 错误代码
    const ENO_ZERO_AMOUNT: u64 = 0;
    const ENO_INSUFFICIENT_BALANCE: u64 = 1;
    const ENO_UNAUTHORIZED: u64 = 2;
    const ENO_LOCK_PERIOD: u64 = 3;
    const ENO_POOL_DISABLED: u64 = 4;
    const ENO_AMOUNT_TOO_SMALL: u64 = 5;
    const ENO_AMOUNT_TOO_LARGE: u64 = 6;
    const ENO_INSUFFICIENT_REWARD: u64 = 7;

    /// 锁定期（24小时）
    const LOCK_PERIOD: u64 = 86400000; // 毫秒

    // 事件
    public struct PoolCreated has copy, drop {
        pool_id: address,
        reward_rate: u64,
        minimum_stake: u64,
        maximum_stake: u64
    }

    public struct PoolConfigUpdated has copy, drop {
        pool_id: address,
        new_reward_rate: u64,
        new_minimum_stake: u64,
        new_maximum_stake: u64
    }

    public struct StakeEvent has copy, drop {
        user: address,
        amount: u64,
        unlock_time: u64
    }

    public struct UnstakeEvent has copy, drop {
        user: address,
        amount: u64,
        reward: u64
    }

    public struct RewardClaimed has copy, drop {
        user: address,
        amount: u64
    }

    /// 创建质押池
    #[init(witness = STAKING)]
    fun init(witness: STAKING, ctx: &mut TxContext) {
        let pool = StakingPool {
            id: object::new(ctx),
            staked_balance: balance::zero(),
            reward_balance: balance::zero(),
            total_staked: 0,
            reward_rate: 100, // 每天1%的奖励率
            last_update_time: 0,
            minimum_stake_amount: 1000000, // 最小质押数量
            maximum_stake_amount: 1000000000, // 最大质押数量
            enabled: true
        };

        let pool_id = object::id_address(&pool);
        
        event::emit(PoolCreated {
            pool_id,
            reward_rate: 100,
            minimum_stake: 1000000,
            maximum_stake: 1000000000
        });

        // 创建管理员权限
        transfer::transfer(AdminCap {
            id: object::new(ctx)
        }, tx_context::sender(ctx));

        transfer::share_object(pool);
    }

    /// 更新池子配置（仅管理员）
    public entry fun update_pool_config(
        _admin: &AdminCap,
        pool: &mut StakingPool,
        new_reward_rate: u64,
        new_minimum_stake: u64,
        new_maximum_stake: u64,
        ctx: &mut TxContext
    ) {
        pool.reward_rate = new_reward_rate;
        pool.minimum_stake_amount = new_minimum_stake;
        pool.maximum_stake_amount = new_maximum_stake;

        event::emit(PoolConfigUpdated {
            pool_id: object::id_address(pool),
            new_reward_rate,
            new_minimum_stake,
            new_maximum_stake
        });
    }

    /// 启用/禁用质押池（仅管理员）
    public entry fun set_pool_enabled(
        _admin: &AdminCap,
        pool: &mut StakingPool,
        enabled: bool
    ) {
        pool.enabled = enabled;
    }

    /// 添加奖励（仅管理员）
    public entry fun add_rewards(
        _admin: &AdminCap,
        pool: &mut StakingPool,
        rewards: Coin<FARM_TOKEN>
    ) {
        let amount = coin::value(&rewards);
        assert!(amount > 0, ENO_ZERO_AMOUNT);
        
        balance::join(&mut pool.reward_balance, coin::into_balance(rewards));
    }

    /// 质押代币
    public entry fun stake(
        pool: &mut StakingPool,
        farm_coins: Coin<FARM_TOKEN>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(pool.enabled, ENO_POOL_DISABLED);
        
        let amount = coin::value(&farm_coins);
        assert!(amount >= pool.minimum_stake_amount, ENO_AMOUNT_TOO_SMALL);
        assert!(amount <= pool.maximum_stake_amount, ENO_AMOUNT_TOO_LARGE);
        assert!(amount > 0, ENO_ZERO_AMOUNT);

        // 更新池子状态
        update_pool(pool, clock);

        let unlock_time = clock::timestamp_ms(clock) + LOCK_PERIOD;

        // 创建质押信息
        let stake_info = StakeInfo {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            amount,
            reward_debt: 0,
            last_stake_time: clock::timestamp_ms(clock),
            unlock_time
        };

        event::emit(StakeEvent {
            user: tx_context::sender(ctx),
            amount,
            unlock_time
        });

        // 转移代币到池中
        balance::join(&mut pool.staked_balance, coin::into_balance(farm_coins));
        pool.total_staked = pool.total_staked + amount;

        transfer::transfer(stake_info, tx_context::sender(ctx));
    }

    /// 解除质押
    public entry fun unstake(
        pool: &mut StakingPool,
        stake_info: &mut StakeInfo,
        amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(stake_info.owner == tx_context::sender(ctx), ENO_UNAUTHORIZED);
        assert!(amount > 0 && amount <= stake_info.amount, ENO_INSUFFICIENT_BALANCE);
        assert!(
            clock::timestamp_ms(clock) >= stake_info.unlock_time,
            ENO_LOCK_PERIOD
        );

        // 更新池子状态
        update_pool(pool, clock);

        // 计算并发放奖励
        let pending_reward = calculate_reward(pool, stake_info);
        if (pending_reward > 0) {
            assert!(balance::value(&pool.reward_balance) >= pending_reward, ENO_INSUFFICIENT_REWARD);
            let reward_coins = coin::take(&mut pool.reward_balance, pending_reward, ctx);
            transfer::public_transfer(reward_coins, stake_info.owner);
        };

        // 更新质押信息
        stake_info.amount = stake_info.amount - amount;
        pool.total_staked = pool.total_staked - amount;

        event::emit(UnstakeEvent {
            user: tx_context::sender(ctx),
            amount,
            reward: pending_reward
        });

        // 返还质押的代币
        let unstaked_coins = coin::take(&mut pool.staked_balance, amount, ctx);
        transfer::public_transfer(unstaked_coins, stake_info.owner);
    }

    /// 领取奖励
    public entry fun claim_reward(
        pool: &mut StakingPool,
        stake_info: &mut StakeInfo,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(stake_info.owner == tx_context::sender(ctx), ENO_UNAUTHORIZED);

        // 更新池子状态
        update_pool(pool, clock);

        // 计算并发放奖励
        let pending_reward = calculate_reward(pool, stake_info);
        assert!(pending_reward > 0, ENO_ZERO_AMOUNT);
        assert!(balance::value(&pool.reward_balance) >= pending_reward, ENO_INSUFFICIENT_REWARD);

        let reward_coins = coin::take(&mut pool.reward_balance, pending_reward, ctx);
        stake_info.reward_debt = stake_info.reward_debt + pending_reward;

        event::emit(RewardClaimed {
            user: tx_context::sender(ctx),
            amount: pending_reward
        });

        transfer::public_transfer(reward_coins, stake_info.owner);
    }

    /// 更新池子状态
    fun update_pool(pool: &mut StakingPool, clock: &Clock) {
        let current_time = clock::timestamp_ms(clock);
        if (current_time <= pool.last_update_time) {
            return
        };

        if (pool.total_staked == 0) {
            pool.last_update_time = current_time;
            return
        };

        let time_elapsed = current_time - pool.last_update_time;
        let reward = (pool.total_staked * pool.reward_rate * time_elapsed) / (24 * 3600 * 1000);
        assert!(balance::value(&pool.reward_balance) >= reward, ENO_INSUFFICIENT_REWARD);
        pool.last_update_time = current_time;
    }

    /// 计算待领取的奖励
    fun calculate_reward(pool: &StakingPool, stake_info: &StakeInfo): u64 {
        if (stake_info.amount == 0) {
            return 0
        };

        let accumulated_reward = (stake_info.amount * pool.reward_rate * 
            (pool.last_update_time - stake_info.last_stake_time)) / (24 * 3600 * 1000);
        
        accumulated_reward - stake_info.reward_debt
    }

    // 测试函数
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(STAKING {}, ctx)
    }

    #[test_only]
    public fun get_pool_info(pool: &StakingPool): (u64, u64, u64, u64, u64, u64, bool) {
        (
            pool.total_staked,
            pool.reward_rate,
            pool.last_update_time,
            pool.minimum_stake_amount,
            pool.maximum_stake_amount,
            balance::value(&pool.reward_balance),
            pool.enabled
        )
    }
}