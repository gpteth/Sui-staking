# **Staking Protocol**

This contract implements a reward distribution mechanism where users can stake their Sui coins and earn FARM token rewards over a specified duration. The contract keeps track of user balances, rewards to be claimed, and manages a treasury for holding staking rewards and staked coins.

## **Overview**

**`RewardState`** is a struct that tracks details about the reward and has the following fields:

- **`id`** (`UID`): Identifier for the reward state object.
- **`duration`** (`u64`): Duration of rewards to be paid out in seconds. This is set by the contract owner.
- **`finishAt`** (`u64`): Timestamp indicating when the rewards will finish.
- **`updatedAt`** (`u64`): The minimum of the last updated time and reward finish time.
- **`rewardRate`** (`u64`): The reward to be paid out per second, determined by the duration and amount of rewards.

**`UserState`** is a struct that keeps track of users' rewards and has the following parameters associated with it:

- **`id`** (`UID`): Identifier for the user state object.
- **`rewardPerTokenStored`** (`u64`): Sum of `(reward rate * dt * 1^(token_decimal) / total staked supply)`, where `dt` is the time difference between the current time and the last updated time.
- **`userRewardPerTokenPaid`** (`VecMap<address, u64>`): Mapping that keeps track of user's `rewardPerTokenStored`.
- **`balanceOf`** (`VecMap<address, u64>`): Mapping that keeps track of user's staked amount.
- **`rewards`** (`VecMap<address, u64>`): Mapping that keeps track of user's rewards to be claimed.

**`Treasury`** is a struct that holds user funds and staking rewards and has the following fields:

- **`id`** (`UID`): Identifier for the treasury object.
- **`rewardsTreasury`** (`Balance<FARM>`): Staking rewards held in the treasury.
- **`stakedCoinsTreasury`** (`Balance<SUI>`): Staked SUI coins held in the treasury.

Access to Admin functions **`setRewardDuration()`** and **`setRewardAmount()`** are granted via the **`AdminCap`** capability which is owned by the owner of the contract.

The contract includes the following functions:

### **`stake`**

This function allows users to stake their tokens.

```rust
public entry fun stake (payment: Coin<SUI>, userState: &mut UserState, rewardState: &mut RewardState, treasury: &mut Treasury, clock: &Clock, ctx: &mut TxContext)
```

If the function succeeds, it will deposit the user's coins into the treasury and emit a **`Staked`** event containing the user's address and the amount staked.

### **`withdraw`**

This function allows users to withdraw their staked tokens.

```rust
public entry fun withdraw(userState: &mut UserState, rewardState: &mut RewardState, treasury: &mut Treasury, amount: u64, clock: &Clock, ctx: &mut TxContext)
```

If the function succeeds, it will withdraw the user's coins from the treasury, return them to the user and emit a **`Withdrawn`** event containing the user's address and the amount withdrawn.

### **`getRewards`**

This function allows users to collect their rewards.

```rust
public entry fun getReward(userState: &mut UserState, rewardState: &mut RewardState, treasury: &mut Treasury, clock: &Clock, ctx: &mut TxContext)
```

If the function succeeds, it will transfer the user's rewards from the treasury and emit a **`RewardPaid`** event containing the user's address and the reward paid.

### **`setRewardDuration`**

This function allows the contract owner to set the reward duration.

```rust
public entry fun setRewardDuration(_: &AdminCap, rewardState: &mut RewardState, duration: u64, clock: &Clock)
```

If the function succeeds, it will set the duration for the staking rewards and emit a **`RewardDurationUpdated`** event containing the updated reward duration.

### **`setRewardAmount`**

This function allows the contract owner to add rewards to the treasury.

```rust
public entry fun setRewardAmount(_: &AdminCap, reward: Coin<FARM>, userState: &mut UserState, rewardState: &mut RewardState, treasury: &mut Treasury, clock: &Clock)
```

If the function succeeds, it will add rewards to the treasury and emit a **`RewardAdded`** event containing the reward amount.

The contract also contains helper functions **`updateReward()`**, **`earned()`**, and **`rewardPerToken()`** which are used for computing the staking rewards.

## **Contract Compilation & Testing**

To compile the contract, execute the following command in the root directory of the project:

```rust
sui move build
```

This will generate the compiled bytecode of the contract. To test the contract, there are test cases located in `./tests`. You can run the tests by executing the following command in the root directory of the project:

```rust
sui move test
```

## **Deployment**

To deploy the smart contract, please follow these steps:

1. Set your Sui client to the desired network (mainnet/testnet/devnet).
2. Navigate to the root directory of the smart contract.
3. Ensure that you have sufficient gas balance for the deployment.
4. Type the following command, replacing `<gas-value>` with the desired amount of gas

   ```rust
   sui client --publish --gas-budget <gas-value>
   ```

## **Usage**

The contract is designed to be used in conjunction with a user interface, such as a web application. When a user performs an action, the user interface should call the corresponding function on the smart contract.

# Sui 质押合约

## 部署信息

合约已部署到 Sui Testnet，主要配置信息存储在 `config.json` 文件中。

### 重要对象

1. 管理员对象
   - AdminCap: 用于管理质押参数和奖励参数
   - UpgradeCap: 用于升级合约
   - TreasuryCap: 用于铸造 FARM 代币

2. 共享对象
   - Treasury: 管理质押资金
   - UserState: 处理用户质押操作
   - RewardState: 处理奖励分发

### 使用说明

1. 管理员操作
   ```bash
   # 设置质押参数
   sui client call --package $PACKAGE_ID --module vault --function set_staking_params \
       --args $ADMIN_CAP $TREASURY $PARAM1 $PARAM2 \
       --gas-budget 10000000

   # 铸造 FARM 代币
   sui client call --package $PACKAGE_ID --module farm --function mint \
       --args $TREASURY_CAP $AMOUNT $RECEIVER \
       --gas-budget 10000000
   ```

2. 用户操作
   ```bash
   # 质押
   sui client call --package $PACKAGE_ID --module vault --function stake \
       --args $USER_STATE $TREASURY $COIN_TO_STAKE \
       --gas-budget 10000000

   # 解除质押
   sui client call --package $PACKAGE_ID --module vault --function unstake \
       --args $USER_STATE $TREASURY $AMOUNT \
       --gas-budget 10000000

   # 领取奖励
   sui client call --package $PACKAGE_ID --module vault --function claim_reward \
       --args $USER_STATE $REWARD_STATE \
       --gas-budget 10000000
   ```

### 安全建议

1. 管理员权限对象应转移到多重签名钱包或安全的冷钱包中
2. 定期检查共享对象状态
3. 重要操作前在测试网验证
4. 保持配置文件的安全，不要将其提交到公共仓库

## 网络信息

- 网络：Testnet
- Chain ID：4c78adac
- 合约地址：0xd889a1160ab43f49907dcc65c6c45204641b362fb8ebf698d3a2c3d916bc5e19
