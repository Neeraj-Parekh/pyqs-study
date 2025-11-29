/**
 * PYQs Study Platform - Utility Functions
 * Helper functions for the study platform
 */

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}-${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Format time in seconds to MM:SS
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Format date to human-readable string
 */
export function formatDateReadable(date: Date): string {
    return date.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayKey(): string {
    return formatDate(new Date());
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return formatDate(date1) === formatDate(date2);
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    return function(this: any, ...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return function(this: any, ...args: Parameters<T>) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Parse tags from comma-separated string
 */
export function parseTags(tagsString: string): string[] {
    return tagsString
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
}

/**
 * Format tags array to comma-separated string
 */
export function formatTags(tags: string[]): string {
    return tags.join(', ');
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Simple hash function for strings
 */
export function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

/**
 * Get a random item from array
 */
export function randomItem<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Group array items by a key function
 */
export function groupBy<T, K extends string | number>(
    array: T[],
    keyFn: (item: T) => K
): Record<K, T[]> {
    return array.reduce((result, item) => {
        const key = keyFn(item);
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(item);
        return result;
    }, {} as Record<K, T[]>);
}

/**
 * Sort array by multiple criteria
 */
export function sortBy<T>(
    array: T[],
    ...criteria: ((a: T, b: T) => number)[]
): T[] {
    return [...array].sort((a, b) => {
        for (const criterion of criteria) {
            const result = criterion(a, b);
            if (result !== 0) return result;
        }
        return 0;
    });
}
