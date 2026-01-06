'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatPrice, formatDateTime, getStatusColor } from '@/lib/utils'
import { OrderStatus } from '@/lib/constants'

interface Order {
    id: string
    order_type: string
    status: string
    total_amount: number
    delivery_address: string | null
    created_at: string
    completed_at: string | null
    shop: {
        id: string
        name: string
        address: string
    }
    order_items: Array<{
        quantity: number
        unit_price: number
        subtotal: number
        shop_product: {
            global_product: {
                name: string
                base_unit: string
            }
        }
    }>
}


function OrdersContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [rating, setRating] = useState(5)
    const [reviewText, setReviewText] = useState('')
    const [isSubmittingReview, setIsSubmittingReview] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        const success = searchParams.get('success')
        const orderId = searchParams.get('orderId')

        if (success === 'true' && orderId) {
            // Show success message
            setTimeout(() => {
                // Keep orderId for guests so they don't get redirected to login
                router.replace(`/consumer/orders?orderId=${orderId}`)
            }, 3000)
        }
    }, [searchParams])

    const loadData = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()

            // Guest Access Check
            const orderIdArg = searchParams.get('orderId')

            if (!authUser) {
                if (orderIdArg) {
                    // Try to fetch specific guest order
                    console.log('Fetching guest order:', orderIdArg)
                    const { data: guestOrder, error } = await supabase
                        .from('orders')
                        .select(`
                          *,
                          shop:shops(id, name, address),
                          order_items(
                            quantity,
                            unit_price,
                            subtotal,
                            shop_product:shop_products(
                              global_product:global_products(name, base_unit)
                            )
                          )
                        `)
                        .eq('id', orderIdArg)
                        .is('consumer_id', null) // Only allow if it's a guest order
                        .single()

                    if (guestOrder) {
                        setOrders([guestOrder as any])
                        // Update last viewed guest order
                        localStorage.setItem('guest_last_order_id', orderIdArg)
                    } else {
                        console.error('Guest order not found or not accessible', error)
                        // Optional: Set a UI error state here to show "Order not found"
                        alert('Could not find order. It may not exist or cannot be accessed.')
                    }
                } else {
                    // No user, no order ID -> Redirect to login
                    router.push('/auth/login')
                    return
                }
                setIsLoading(false)
                return
            }

            // Authenticated User Logic
            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single()

            setUser(userData)

            // Load orders
            const { data: ordersData } = await supabase
                .from('orders')
                .select(`
                  *,
                  shop:shops(id, name, address),
                  order_items(
                    quantity,
                    unit_price,
                    subtotal,
                    shop_product:shop_products(
                      global_product:global_products(name, base_unit)
                    )
                  )
                `)
                .eq('consumer_id', authUser.id)
                .order('created_at', { ascending: false })

            if (ordersData) {
                setOrders(ordersData as any)
            }
        } catch (error) {
            console.error('Error loading orders:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const canReview = (order: Order) => {
        return ['delivered', 'completed'].includes(order.status)
    }

    const handleReviewSubmit = async () => {
        if (!selectedOrder) return

        setIsSubmittingReview(true)
        try {
            const { error } = await supabase
                .from('shop_reviews')
                .insert({
                    shop_id: selectedOrder.shop.id,
                    consumer_id: user.id,
                    order_id: selectedOrder.id,
                    rating,
                    review_text: reviewText
                })

            if (error) throw error

            setShowReviewModal(false)
            setSelectedOrder(null)
            setRating(5)
            setReviewText('')

            // Reload orders
            loadData()
        } catch (error: any) {
            console.error('Error submitting review:', error)
            alert(error.message || 'Failed to submit review')
        } finally {
            setIsSubmittingReview(false)
        }
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'pending':
            case 'confirmed':
                return 'warning'
            case 'preparing':
            case 'ready':
            case 'out_for_delivery':
                return 'info'
            case 'delivered':
            case 'completed':
                return 'success'
            case 'cancelled':
                return 'danger'
            default:
                return 'default'
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header user={user} />
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner size="lg" />
                </div>
            </div>
        )
    }

    const success = searchParams.get('success')

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {user ? 'My Orders' : 'Order Status'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {user ? 'Track and manage your orders' : 'Viewing guest order details'}
                    </p>
                </div>

                {success === 'true' && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                        ✅ Order placed successfully! Your order is being processed.
                    </div>
                )}

                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="text-6xl mb-4">📦</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
                            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                            <Button variant="primary" onClick={() => router.push('/consumer')}>
                                Browse Shops
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Card key={order.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle>Order from {order.shop.name}</CardTitle>
                                            <CardDescription className="mt-1">
                                                {formatDateTime(order.created_at)}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={getStatusBadgeVariant(order.status)}>
                                            {order.status.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Order Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="text-sm text-gray-600">Order Type</p>
                                                <p className="font-medium">
                                                    {order.order_type === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Total Amount</p>
                                                <p className="font-medium text-emerald-600 text-lg">
                                                    {formatPrice(order.total_amount)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">
                                                    {order.order_type === 'delivery' ? 'Delivery Address' : 'Pickup Location'}
                                                </p>
                                                <p className="font-medium text-sm">
                                                    {order.order_type === 'delivery' ? order.delivery_address : order.shop.address}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                                            <div className="space-y-2">
                                                {order.order_items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            {item.shop_product.global_product.name} × {item.quantity} {item.shop_product.global_product.base_unit}
                                                        </span>
                                                        <span className="font-medium">{formatPrice(item.subtotal)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Order Status Timeline */}
                                        <div className="border-t pt-4">
                                            <p className="text-sm font-medium text-gray-700 mb-3">Order Status:</p>
                                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                                {['pending', 'confirmed', 'preparing', 'ready',
                                                    order.order_type === 'delivery' ? 'out_for_delivery' : null,
                                                    order.order_type === 'delivery' ? 'delivered' : 'completed'
                                                ].filter(Boolean).map((status, idx, arr) => {
                                                    const currentIndex = arr.indexOf(order.status)
                                                    const isActive = idx <= currentIndex
                                                    const isCurrent = status === order.status

                                                    return (
                                                        <div key={status} className="flex items-center">
                                                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${isActive ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                                                                } ${isCurrent ? 'ring-4 ring-emerald-200' : ''}`}>
                                                                {idx + 1}
                                                            </div>
                                                            {idx < arr.length - 1 && (
                                                                <div className={`w-12 h-1 ${isActive ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            <div className="flex gap-2 mt-2 text-xs text-gray-600">
                                                <span className="capitalize">{order.status.replace('_', ' ')}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {canReview(order) && (
                                            <div className="border-t pt-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedOrder(order)
                                                        setShowReviewModal(true)
                                                    }}
                                                >
                                                    ⭐ Write a Review
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Review Modal */}
                {showReviewModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <Card className="max-w-md w-full">
                            <CardHeader>
                                <CardTitle>Review {selectedOrder.shop.name}</CardTitle>
                                <CardDescription>Share your experience with this shop</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Rating
                                        </label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => setRating(star)}
                                                    className={`text-3xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                >
                                                    ⭐
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Review (Optional)
                                        </label>
                                        <textarea
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            placeholder="Tell us about your experience..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                                            rows={4}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="primary"
                                            className="flex-1"
                                            onClick={handleReviewSubmit}
                                            isLoading={isSubmittingReview}
                                        >
                                            Submit Review
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowReviewModal(false)
                                                setSelectedOrder(null)
                                                setRating(5)
                                                setReviewText('')
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    )
}

export default function OrdersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        }>
            <OrdersContent />
        </Suspense>
    )
}
