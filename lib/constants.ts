// User Roles
export enum UserRole {
    ADMIN = 'admin',
    SHOP_OWNER = 'shop_owner',
    CONSUMER = 'consumer',
    DELIVERY_PARTNER = 'delivery_partner',
}

// Order Status
export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PREPARING = 'preparing',
    READY = 'ready',
    OUT_FOR_DELIVERY = 'out_for_delivery',
    DELIVERED = 'delivered',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

// Order Type
export enum OrderType {
    DELIVERY = 'delivery',
    PICKUP = 'pickup',
    WALK_IN = 'walk_in',
}

// Product Request Status
export enum ProductRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

// App Configuration
export const APP_CONFIG = {
    DEFAULT_SEARCH_RADIUS_KM: Number(process.env.NEXT_PUBLIC_DEFAULT_SEARCH_RADIUS_KM) || 10,
    MAX_SEARCH_RADIUS_KM: 50,
    MIN_SEARCH_RADIUS_KM: 1,
    ITEMS_PER_PAGE: 20,
    MAX_CART_ITEMS: 50,
} as const

// Route Paths
export const ROUTES = {
    HOME: '/',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',

    // Admin Routes
    ADMIN_DASHBOARD: '/admin',
    ADMIN_PRODUCTS: '/admin/products',
    ADMIN_SHOPS: '/admin/shops',
    ADMIN_USERS: '/admin/users',

    // Shop Owner Routes
    SHOP_OWNER_DASHBOARD: '/shop-owner',
    SHOP_OWNER_PRODUCTS: '/shop-owner/products',
    SHOP_OWNER_ORDERS: '/shop-owner/orders',
    SHOP_OWNER_POS: '/shop-owner/pos',
    SHOP_OWNER_REPORTS: '/shop-owner/reports',
    SHOP_OWNER_SETTINGS: '/shop-owner/settings',

    // Consumer Routes
    CONSUMER_DASHBOARD: '/consumer',
    CONSUMER_SHOPS: '/consumer/shops',
    CONSUMER_CART: '/consumer/cart',
    CONSUMER_ORDERS: '/consumer/orders',
    CONSUMER_PROFILE: '/consumer/profile',

    // Delivery Partner Routes
    DELIVERY_DASHBOARD: '/delivery',
    DELIVERY_ORDERS: '/delivery/orders',
} as const

// Database Tables
export const TABLES = {
    USERS: 'users',
    SHOPS: 'shops',
    GLOBAL_PRODUCTS: 'global_products',
    SHOP_PRODUCTS: 'shop_products',
    PRODUCT_REQUESTS: 'product_requests',
    ORDERS: 'orders',
    ORDER_ITEMS: 'order_items',
    DELIVERY_PARTNERS: 'delivery_partners',
    INVOICES: 'invoices',
} as const
