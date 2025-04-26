/**
 * 将数字从较小单位转换为较大单位（例如：wei -> ether）
 */
export function formatUnits(value: bigint | string, decimals: number): string {
    if (!value) return '0';
    
    const valueStr = value.toString();
    const paddedValue = valueStr.padStart(decimals, '0');
    const integerPart = paddedValue.slice(0, -decimals) || '0';
    const fractionalPart = paddedValue.slice(-decimals).replace(/0+$/, '');
    
    return fractionalPart 
        ? `${integerPart}.${fractionalPart}`
        : integerPart;
}

/**
 * 将数字从较大单位转换为较小单位（例如：ether -> wei）
 */
export function parseUnits(value: string, decimals: number): bigint {
    if (!value || value === '.') return BigInt(0);

    const [integerPart = '0', fractionalPart = ''] = value.split('.');
    const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
    
    return BigInt(integerPart + paddedFractional);
}

/**
 * 格式化数字，添加千位分隔符
 */
export function formatNumber(value: string | number): string {
    return new Intl.NumberFormat().format(Number(value));
}

/**
 * 截断长字符串，通常用于地址显示
 */
export function truncateAddress(address: string, start = 6, end = 4): string {
    if (!address) return '';
    if (address.length <= start + end) return address;
    
    return `${address.slice(0, start)}...${address.slice(-end)}`;
} 