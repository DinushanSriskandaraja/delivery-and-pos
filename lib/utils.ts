import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1)
    const dLon = toRadians(lon2 - lon1)

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return Math.round(distance * 100) / 100 // Round to 2 decimal places
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: string = 'LKR'): string {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: currency,
    }).format(amount)
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d)
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d)
}

/**
 * Generate a unique invoice number
 */
export function generateInvoiceNumber(): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `INV-${timestamp}-${random}`
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Validate phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-()]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text
    return text.substring(0, length) + '...'
}

/**
 * Calculate order total from items
 */
export function calculateOrderTotal(
    items: Array<{ quantity: number; unit_price: number }>
): number {
    return items.reduce((total, item) => {
        return total + item.quantity * item.unit_price
    }, 0)
}

/**
 * Get status color for badges
 */
export function getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        preparing: 'bg-purple-100 text-purple-800',
        ready: 'bg-green-100 text-green-800',
        out_for_delivery: 'bg-indigo-100 text-indigo-800',
        delivered: 'bg-green-100 text-green-800',
        completed: 'bg-gray-100 text-gray-800',
        cancelled: 'bg-red-100 text-red-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
}
