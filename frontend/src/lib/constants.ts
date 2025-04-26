// 合约包 ID
export const STAKING_PACKAGE_ID = '0xd889a1160ab43f49907dcc65c6c45204641b362fb8ebf698d3a2c3d916bc5e19';
export const FARM_PACKAGE_ID = '0xd889a1160ab43f49907dcc65c6c45204641b362fb8ebf698d3a2c3d916bc5e19';
export const LIQUIDITY_PACKAGE_ID = '0xd889a1160ab43f49907dcc65c6c45204641b362fb8ebf698d3a2c3d916bc5e19';

// 网络配置
export const NETWORK = 'testnet';
export const RPC_URL = 'https://fullnode.testnet.sui.io';

// 常量
export const DECIMALS = 9; // 代币精度
export const DEFAULT_GAS_BUDGET = 10000; // 默认 gas 预算

// 合约地址
export const FARM_TOKEN_TYPE = `${STAKING_PACKAGE_ID}::farm::FARM`;
export const LP_TOKEN_TYPE = `${LIQUIDITY_PACKAGE_ID}::liquidity_pool::LP_TOKEN`;

// 共享对象 ID
export const TREASURY_ID = '0xaf2486a36ba954f20ac2214ecb7787c3d37c43022a976225406ad3b58aa3d92b';
export const USER_STATE_ID = '0x5a1a94bce876bd4d6906b89d841981222ea80b20481a621bbe0263d004403a26';
export const REWARD_STATE_ID = '0x6e3ec086b184bdd51c094b7e5dd47bbfaeba71b9e4e94c16b6bf6f76eefb7342';

// 错误信息
export const ERROR_MESSAGES = {
    INSUFFICIENT_BALANCE: '余额不足',
    SLIPPAGE_TOO_HIGH: '滑点过高',
    PRICE_IMPACT_TOO_HIGH: '价格影响过大',
    TRANSACTION_FAILED: '交易失败',
    USER_REJECTED: '用户拒绝交易',
    NETWORK_ERROR: '网络错误',
    NO_TOKENS: '没有找到代币',
};

// UI 配置
export const UI_CONFIG = {
    MAX_SLIPPAGE: 50, // 最大滑点 0.5%
    DEFAULT_SLIPPAGE: 10, // 默认滑点 0.1%
    MIN_LIQUIDITY: 1000000, // 最小流动性
    REFRESH_INTERVAL: 10000, // 数据刷新间隔（毫秒）
    MAX_PRICE_IMPACT: 15, // 最大价格影响 15%
}; 