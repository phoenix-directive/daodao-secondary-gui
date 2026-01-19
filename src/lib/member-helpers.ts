/**
 * Utility functions for member list formatting and calculations
 * Keep separate from components to maintain Fast Refresh
 */

import { Member } from '@/lib/voting-modules/types';

export interface MemberWithPercentage extends Member {
    percentage: number;
}

/**
 * Format a number with specified decimals
 */
export function formatNumber(value: number, decimals: number) {
    return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

/**
 * Format voting power with decimals
 */
export function formatVotingPower(power: string, decimals: number): string {
    try {
        if (!decimals) {
            return power;
        } else {
            return formatNumber(
                parseFloat((BigInt(power) / BigInt(10 ** decimals)).toString()),
                decimals,
            );
        }
    } catch (error) {
        console.error('Error formatting voting power:', error);
        return power;
    }
}

/**
 * Format percentage value
 */
export function formatPercentage(percentage: number): string {
    return percentage < 0.001 && percentage > 0 ? '<0.001' : percentage.toFixed(3);
}

/**
 * Get styled color/weight for percentage display
 */
export function getPercentageStyle(percentage: number, maxPercentage: number) {
    const normalized = Math.min(percentage / maxPercentage, 1);
    return {
        opacity: 0.7 + normalized * 0.3,
        color: normalized > 0.3 ? 'var(--primary)' : 'var(--muted-foreground)',
        fontWeight: normalized > 0.5 ? 600 : 500,
    };
}

/**
 * Calculate member percentages from voting power
 */
export function calculateMemberPercentages(
    members: Member[],
    total: string,
): MemberWithPercentage[] {
    const totalBig = BigInt(total);
    return members.map((member) => {
        const votingPowerBig = BigInt(member.votingPower);
        const percentage =
            totalBig > BigInt(0)
                ? Number(votingPowerBig * BigInt(100000)) / Number(totalBig) / 1000
                : 0;

        return {
            ...member,
            percentage,
        };
    });
}
