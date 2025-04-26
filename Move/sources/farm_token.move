module farm::farm_token {
    use std::option;
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::url;
    use sui::event;
    use std::vector;

    /// FARM代币的结构体定义
    public struct FARM_TOKEN has drop {}

    /// 错误代码
    const ENO_ZERO_AMOUNT: u64 = 0;
    const ENO_INSUFFICIENT_BALANCE: u64 = 1;
    const ENO_UNAUTHORIZED: u64 = 2;
    const ENO_INVALID_INPUT: u64 = 3;

    // 事件
    public struct TokensMinted has copy, drop {
        amount: u64,
        recipient: address
    }

    public struct TokensBurned has copy, drop {
        amount: u64,
        burner: address
    }

    public struct TokensTransferred has copy, drop {
        from: address,
        to: address,
        amount: u64
    }

    /// 初始化函数 - 创建代币
    #[init(witness = FARM_TOKEN)]
    fun init(witness: FARM_TOKEN, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness,
            9, // 精度
            b"FARM",
            b"Farm Token",
            b"The governance token for the Farm protocol",
            option::some(url::new_unsafe_from_bytes(b"https://farm-token.com/logo.png")),
            ctx
        );

        // 转移TreasuryCap给部署者
        transfer::public_transfer(treasury, tx_context::sender(ctx));
        // 转移CoinMetadata给部署者
        transfer::public_transfer(metadata, tx_context::sender(ctx));
    }

    /// 铸造新代币
    public entry fun mint(
        treasury_cap: &mut TreasuryCap<FARM_TOKEN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(amount > 0, ENO_ZERO_AMOUNT);
        let coin = coin::mint(treasury_cap, amount, ctx);
        event::emit(TokensMinted { amount, recipient });
        transfer::public_transfer(coin, recipient);
    }

    /// 销毁代币
    public entry fun burn(
        treasury_cap: &mut TreasuryCap<FARM_TOKEN>,
        coin: Coin<FARM_TOKEN>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&coin);
        let burner = tx_context::sender(ctx);
        event::emit(TokensBurned { amount, burner });
        coin::burn(treasury_cap, coin);
    }

    /// 转账功能
    public entry fun transfer(
        coin: &mut Coin<FARM_TOKEN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(amount > 0, ENO_ZERO_AMOUNT);
        assert!(coin::value(coin) >= amount, ENO_INSUFFICIENT_BALANCE);
        
        let split_coin = coin::split(coin, amount, ctx);
        let sender = tx_context::sender(ctx);
        event::emit(TokensTransferred { 
            from: sender,
            to: recipient,
            amount 
        });
        transfer::public_transfer(split_coin, recipient);
    }

    /// 批量转账功能
    public entry fun batch_transfer(
        coin: &mut Coin<FARM_TOKEN>,
        amounts: vector<u64>,
        recipients: vector<address>,
        ctx: &mut TxContext
    ) {
        assert!(vector::length(&amounts) == vector::length(&recipients), ENO_INVALID_INPUT);
        
        while (!vector::is_empty(&amounts)) {
            let amount = vector::pop_back(&mut amounts);
            let recipient = vector::pop_back(&mut recipients);
            
            assert!(amount > 0, ENO_ZERO_AMOUNT);
            assert!(coin::value(coin) >= amount, ENO_INSUFFICIENT_BALANCE);
            
            let split_coin = coin::split(coin, amount, ctx);
            let sender = tx_context::sender(ctx);
            event::emit(TokensTransferred { 
                from: sender,
                to: recipient,
                amount 
            });
            transfer::public_transfer(split_coin, recipient);
        }
    }

    // 测试函数
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(FARM_TOKEN {}, ctx)
    }
} 