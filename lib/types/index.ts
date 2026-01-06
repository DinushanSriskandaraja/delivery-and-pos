import { UserRole, OrderStatus, OrderType, ProductRequestStatus } from '../constants'

// Database Types
export interface User {
    id: string
    email: string
    role: UserRole
    full_name: string
    phone: string
    created_at: string
}

export interface Shop {
    id: string
    owner_id: string
    name: string
    description: string
    address: string
    latitude: number
    longitude: number
    is_active: boolean
    is_approved: boolean
    created_at: string
}

export interface GlobalProduct {
    id: string
    name: string
    description: string
    category: string
    base_unit: string
    image_url: string
    is_approved: boolean
    created_by: string
    created_at: string
}

export interface ShopProduct {
    id: string
    shop_id: string
    global_product_id: string
    price: number
    stock_quantity: number
    is_available: boolean
    updated_at: string
    global_product?: GlobalProduct
    shop?: Shop
}

export interface ProductRequest {
    id: string
    shop_id: string
    product_name: string
    description: string
    category: string
    status: ProductRequestStatus
    created_at: string
    shop?: Shop
}

export interface Order {
    id: string
    consumer_id: string
    shop_id: string
    order_type: OrderType
    status: OrderStatus
    total_amount: number
    delivery_address?: string
    delivery_latitude?: number
    delivery_longitude?: number
    assigned_delivery_partner_id?: string
    created_at: string
    completed_at?: string
    consumer?: User
    shop?: Shop
    delivery_partner?: User
    order_items?: OrderItem[]
}

export interface OrderItem {
    id: string
    order_id: string
    shop_product_id: string
    quantity: number
    unit_price: number
    subtotal: number
    shop_product?: ShopProduct
}

export interface DeliveryPartner {
    id: string
    user_id: string
    vehicle_type: string
    is_available: boolean
    current_latitude?: number
    current_longitude?: number
    rating: number
    user?: User
}

export interface Invoice {
    id: string
    order_id: string
    invoice_number: string
    issued_at: string
    pdf_url?: string
    order?: Order
}

// Form Types
export interface LoginFormData {
    email: string
    password: string
}

export interface RegisterFormData {
    email: string
    password: string
    full_name: string
    phone: string
    role: UserRole
}

export interface ShopFormData {
    name: string
    description: string
    address: string
    latitude: number
    longitude: number
}

export interface ProductFormData {
    name: string
    description: string
    category: string
    base_unit: string
    image_url: string
}

export interface ShopProductFormData {
    global_product_id: string
    price: number
    stock_quantity: number
    is_available: boolean
}

export interface OrderFormData {
    shop_id: string
    order_type: OrderType
    delivery_address?: string
    delivery_latitude?: number
    delivery_longitude?: number
    items: Array<{
        shop_product_id: string
        quantity: number
    }>
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
}

// Component Props Types
export interface ShopWithDistance extends Shop {
    distance: number
}

export interface ProductWithShop extends ShopProduct {
    shop: Shop
    global_product: GlobalProduct
}

export interface OrderWithDetails extends Order {
    consumer: User
    shop: Shop
    order_items: Array<OrderItem & { shop_product: ShopProduct & { global_product: GlobalProduct } }>
    delivery_partner?: User
}

// Cart Types
export interface CartItem {
    shop_product_id: string
    shop_product: ShopProduct & { global_product: GlobalProduct }
    quantity: number
}

export interface Cart {
    shop_id: string
    shop: Shop
    items: CartItem[]
    total: number
}
