/**
 * Truncates a crypto address to a shorter format.
 * @param address The full address string.
 * @param startLength Number of characters to show at the start.
 * @param endLength Number of characters to show at the end.
 * @returns The truncated address (e.g., "0x1234...5678").
 */
export const truncateAddress = (
    address: string,
    startLength: number = 6,
    endLength: number = 4
): string => {
    if (!address) return ''
    if (address.length <= startLength + endLength) return address
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

/**
 * Formats a balance amount.
 * @param balance The balance to format.
 * @returns A formatted string.
 */
export const formatBalance = (balance: number | string): string => {
    const num = Number(balance)
    if (isNaN(num)) return '0.00'
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
    })
}
