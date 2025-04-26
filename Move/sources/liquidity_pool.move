module farm::liquidity_pool {
    use sui::object::{Self, UID};
    use sui::balance::{Self, Balance, Supply};
    use sui::coin::{Self, Coin};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};
    use farm::farm_token::FARM_TOKEN;
    use sui::sui::SUI;

    /// LP代币结构体
    public struct LP_TOKEN has drop {}

    /// 流动性池结构体
    public struct Pool has key {
        id: UID,
        farm_balance: Balance<FARM_TOKEN>,
        sui_balance: Balance<SUI>,
        lp_supply: Supply<LP_TOKEN>,
        fee_percent: u64,      // 手续费百分比（基点：1 = 0.01%）
        is_paused: bool,       // 紧急暂停开关
        min_liquidity: u64,    // 最小流动性要求
        last_price: u64,       // 最后一次交易价格（用于价格追踪）
        accumulated_fees: Balance<SUI> // 累积的手续费
    }

    /// 管理员权限结构体
    public struct AdminCap has key {
        id: UID
    }

    /// 错误代码
    const ENO_ZERO_AMOUNT: u64 = 0;
    const ENO_INSUFFICIENT_LIQUIDITY: u64 = 1;
    const ENO_INSUFFICIENT_AMOUNT: u64 = 2;
    const ENO_POOL_PAUSED: u64 = 3;
    const ENO_SLIPPAGE_TOO_HIGH: u64 = 4;
    const ENO_INSUFFICIENT_INITIAL_LIQUIDITY: u64 = 5;
    const ENO_UNAUTHORIZED: u64 = 6;
    const ENO_INVALID_FEE: u64 = 7;
    const ENO_PRICE_IMPACT_TOO_HIGH: u64 = 8;

    // 常量
    const MAX_FEE_PERCENT: u64 = 1000; // 最大手续费10%
    const PRICE_IMPACT_LIMIT: u64 = 2000; // 最大价格影响20%
    const MINIMUM_LIQUIDITY: u64 = 1000000; // 最小流动性

    // 事件
    public struct PoolCreated has copy, drop {
        pool_id: address,
        initial_farm_amount: u64,
        initial_sui_amount: u64
    }

    public struct LiquidityAdded has copy, drop {
        provider: address,
        farm_amount: u64,
        sui_amount: u64,
        lp_tokens: u64
    }

    public struct LiquidityRemoved has copy, drop {
        provider: address,
        farm_amount: u64,
        sui_amount: u64,
        lp_tokens: u64
    }

    public struct SwapExecuted has copy, drop {
        user: address,
        input_amount: u64,
        output_amount: u64,
        fee_amount: u64,
        is_farm_to_sui: bool
    }

    public struct PoolConfigUpdated has copy, drop {
        pool_id: address,
        new_fee_percent: u64,
        new_min_liquidity: u64
    }

    public struct FeesCollected has copy, drop {
        amount: u64,
        recipient: address
    }

    /// 创建新的流动性池
    fun init(ctx: &mut TxContext) {
        let pool = Pool {
            id: object::new(ctx),
            farm_balance: balance::zero(),
            sui_balance: balance::zero(),
            lp_supply: balance::create_supply(LP_TOKEN {}),
            fee_percent: 30, // 默认0.3%手续费
            is_paused: false,
            min_liquidity: MINIMUM_LIQUIDITY,
            last_price: 0,
            accumulated_fees: balance::zero()
        };

        // 创建管理员权限
        transfer::transfer(AdminCap {
            id: object::new(ctx)
        }, tx_context::sender(ctx));

        transfer::share_object(pool);
    }

    /// 添加流动性
    public entry fun add_liquidity(
        pool: &mut Pool,
        farm_coins: Coin<FARM_TOKEN>,
        sui_coins: Coin<SUI>,
        min_lp_tokens: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!pool.is_paused, ENO_POOL_PAUSED);
        
        let farm_amount = coin::value(&farm_coins);
        let sui_amount = coin::value(&sui_coins);
        
        assert!(farm_amount > 0 && sui_amount > 0, ENO_ZERO_AMOUNT);

        // 计算LP代币数量
        let lp_amount = if (balance::supply_value(&pool.lp_supply) == 0) {
            // 首次添加流动性
            assert!(farm_amount >= pool.min_liquidity && sui_amount >= pool.min_liquidity, 
                   ENO_INSUFFICIENT_INITIAL_LIQUIDITY);
            ((farm_amount as u128) * (sui_amount as u128)) as u64
        } else {
            let farm_reserve = balance::value(&pool.farm_balance);
            let sui_reserve = balance::value(&pool.sui_balance);
            
            let farm_ratio = ((farm_amount as u128) * 1000) / (farm_reserve as u128);
            let sui_ratio = ((sui_amount as u128) * 1000) / (sui_reserve as u128);
            
            let min_ratio = if (farm_ratio < sui_ratio) { farm_ratio } else { sui_ratio };
            let lp_supply = balance::supply_value(&pool.lp_supply);
            ((lp_supply as u128) * min_ratio / 1000) as u64
        };

        assert!(lp_amount >= min_lp_tokens, ENO_INSUFFICIENT_LIQUIDITY);

        // 更新最后价格
        if (balance::value(&pool.farm_balance) > 0) {
            pool.last_price = (sui_amount * 1_000_000) / farm_amount;
        };

        // 转移代币到池中
        balance::join(&mut pool.farm_balance, coin::into_balance(farm_coins));
        balance::join(&mut pool.sui_balance, coin::into_balance(sui_coins));

        // 铸造并转移LP代币
        let lp_balance = balance::increase_supply(&mut pool.lp_supply, lp_amount);
        let lp_coins = coin::from_balance(lp_balance, ctx);

        event::emit(LiquidityAdded {
            provider: tx_context::sender(ctx),
            farm_amount,
            sui_amount,
            lp_tokens: lp_amount
        });

        transfer::public_transfer(lp_coins, tx_context::sender(ctx));
    }

    /// 移除流动性
    public entry fun remove_liquidity(
        pool: &mut Pool,
        lp_coins: Coin<LP_TOKEN>,
        min_farm_out: u64,
        min_sui_out: u64,
        ctx: &mut TxContext
    ) {
        assert!(!pool.is_paused, ENO_POOL_PAUSED);

        let lp_amount = coin::value(&lp_coins);
        assert!(lp_amount > 0, ENO_ZERO_AMOUNT);

        let total_supply = balance::supply_value(&pool.lp_supply);
        assert!(lp_amount <= total_supply, ENO_INSUFFICIENT_LIQUIDITY);

        // 计算返还的代币数量
        let farm_amount = ((balance::value(&pool.farm_balance) as u128) * 
                         (lp_amount as u128) / (total_supply as u128)) as u64;
        let sui_amount = ((balance::value(&pool.sui_balance) as u128) * 
                        (lp_amount as u128) / (total_supply as u128)) as u64;

        assert!(farm_amount >= min_farm_out && sui_amount >= min_sui_out, ENO_INSUFFICIENT_AMOUNT);

        // 销毁LP代币
        balance::decrease_supply(&mut pool.lp_supply, coin::into_balance(lp_coins));

        // 返还代币
        let farm_coins = coin::take(&mut pool.farm_balance, farm_amount, ctx);
        let sui_coins = coin::take(&mut pool.sui_balance, sui_amount, ctx);

        event::emit(LiquidityRemoved {
            provider: tx_context::sender(ctx),
            farm_amount,
            sui_amount,
            lp_tokens: lp_amount
        });

        transfer::public_transfer(farm_coins, tx_context::sender(ctx));
        transfer::public_transfer(sui_coins, tx_context::sender(ctx));
    }

    /// 交换FARM到SUI
    public entry fun swap_farm_to_sui(
        pool: &mut Pool,
        farm_coins: Coin<FARM_TOKEN>,
        min_sui_out: u64,
        ctx: &mut TxContext
    ) {
        assert!(!pool.is_paused, ENO_POOL_PAUSED);

        let farm_in = coin::value(&farm_coins);
        assert!(farm_in > 0, ENO_ZERO_AMOUNT);

        let (sui_out, fee_amount) = calculate_swap_output(
            farm_in,
            balance::value(&pool.farm_balance),
            balance::value(&pool.sui_balance),
            pool.fee_percent
        );

        assert!(sui_out >= min_sui_out, ENO_INSUFFICIENT_AMOUNT);

        // 检查价格影响
        let new_price = ((balance::value(&pool.sui_balance) - sui_out) * 1_000_000) / 
                       (balance::value(&pool.farm_balance) + farm_in);
        let price_impact = if (new_price > pool.last_price) {
            ((new_price - pool.last_price) * 10000) / pool.last_price
        } else {
            ((pool.last_price - new_price) * 10000) / pool.last_price
        };
        assert!(price_impact <= PRICE_IMPACT_LIMIT, ENO_PRICE_IMPACT_TOO_HIGH);

        // 执行交换
        balance::join(&mut pool.farm_balance, coin::into_balance(farm_coins));
        let sui_coins = coin::take(&mut pool.sui_balance, sui_out, ctx);

        // 收取手续费
        let fee_coins = coin::take(&mut pool.sui_balance, fee_amount, ctx);
        balance::join(&mut pool.accumulated_fees, coin::into_balance(fee_coins));

        event::emit(SwapExecuted {
            user: tx_context::sender(ctx),
            input_amount: farm_in,
            output_amount: sui_out,
            fee_amount,
            is_farm_to_sui: true
        });

        pool.last_price = new_price;
        transfer::public_transfer(sui_coins, tx_context::sender(ctx));
    }

    /// 交换SUI到FARM
    public entry fun swap_sui_to_farm(
        pool: &mut Pool,
        sui_coins: Coin<SUI>,
        min_farm_out: u64,
        ctx: &mut TxContext
    ) {
        assert!(!pool.is_paused, ENO_POOL_PAUSED);

        let sui_in = coin::value(&sui_coins);
        assert!(sui_in > 0, ENO_ZERO_AMOUNT);

        let (farm_out, fee_amount) = calculate_swap_output(
            sui_in,
            balance::value(&pool.sui_balance),
            balance::value(&pool.farm_balance),
            pool.fee_percent
        );

        assert!(farm_out >= min_farm_out, ENO_INSUFFICIENT_AMOUNT);

        // 检查价格影响
        let new_price = ((balance::value(&pool.sui_balance) + sui_in) * 1_000_000) / 
                       (balance::value(&pool.farm_balance) - farm_out);
        let price_impact = if (new_price > pool.last_price) {
            ((new_price - pool.last_price) * 10000) / pool.last_price
        } else {
            ((pool.last_price - new_price) * 10000) / pool.last_price
        };
        assert!(price_impact <= PRICE_IMPACT_LIMIT, ENO_PRICE_IMPACT_TOO_HIGH);

        // 执行交换
        balance::join(&mut pool.sui_balance, coin::into_balance(sui_coins));
        let farm_coins = coin::take(&mut pool.farm_balance, farm_out, ctx);

        // 收取手续费
        let fee_coins = coin::take(&mut pool.farm_balance, fee_amount, ctx);
        let sui_value = (fee_amount * pool.last_price) / 1_000_000;
        let sui_fee = coin::take(&mut pool.sui_balance, sui_value, ctx);
        balance::join(&mut pool.accumulated_fees, coin::into_balance(sui_fee));

        event::emit(SwapExecuted {
            user: tx_context::sender(ctx),
            input_amount: sui_in,
            output_amount: farm_out,
            fee_amount,
            is_farm_to_sui: false
        });

        pool.last_price = new_price;
        transfer::public_transfer(farm_coins, tx_context::sender(ctx));
    }

    /// 更新池子配置（仅管理员）
    public entry fun update_pool_config(
        _admin: &AdminCap,
        pool: &mut Pool,
        new_fee_percent: u64,
        new_min_liquidity: u64,
        ctx: &mut TxContext
    ) {
        assert!(new_fee_percent <= MAX_FEE_PERCENT, ENO_INVALID_FEE);
        
        pool.fee_percent = new_fee_percent;
        pool.min_liquidity = new_min_liquidity;

        event::emit(PoolConfigUpdated {
            pool_id: object::id_address(pool),
            new_fee_percent,
            new_min_liquidity
        });
    }

    /// 紧急暂停/恢复（仅管理员）
    public entry fun set_paused(
        _admin: &AdminCap,
        pool: &mut Pool,
        paused: bool
    ) {
        pool.is_paused = paused;
    }

    /// 收集累积的手续费（仅管理员）
    public entry fun collect_fees(
        _admin: &AdminCap,
        pool: &mut Pool,
        ctx: &mut TxContext
    ) {
        let fee_amount = balance::value(&pool.accumulated_fees);
        assert!(fee_amount > 0, ENO_ZERO_AMOUNT);

        let fee_coins = coin::take(&mut pool.accumulated_fees, fee_amount, ctx);

        event::emit(FeesCollected {
            amount: fee_amount,
            recipient: tx_context::sender(ctx)
        });

        transfer::public_transfer(fee_coins, tx_context::sender(ctx));
    }

    /// 计算交换输出金额
    fun calculate_swap_output(
        amount_in: u64,
        reserve_in: u64,
        reserve_out: u64,
        fee_percent: u64
    ): (u64, u64) {
        let amount_in_with_fee = (((amount_in as u128) * ((10000 - fee_percent) as u128)) / 10000);
        let numerator = amount_in_with_fee * (reserve_out as u128);
        let denominator = (reserve_in as u128) + amount_in_with_fee;
        let amount_out = (numerator / denominator) as u64;
        let fee_amount = ((amount_in as u128) * (fee_percent as u128) / 10000) as u64;
        (amount_out, fee_amount)
    }

    // 测试函数
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }

    #[test_only]
    public fun get_pool_info(pool: &Pool): (u64, u64, u64, u64, u64, u64, bool) {
        (
            balance::value(&pool.farm_balance),
            balance::value(&pool.sui_balance),
            balance::supply_value(&pool.lp_supply),
            pool.fee_percent,
            pool.min_liquidity,
            pool.last_price,
            pool.is_paused
        )
    }
} 