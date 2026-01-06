'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatPrice, formatDateTime } from '@/lib/utils'

export default function ShopOwnerOrdersPage() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [shop, setShop] = useState<any>(null)
    const [orders, setOrders] = useState<any[]>([])
    const [deliveryPartners, setDeliveryPartners] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedStatus, setSelectedStatus] = useState<string>('all')
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) {
                router.push('/auth/login')
                return
            }

            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (!userData || userData.role !== 'shop_owner') {
                router.push('/auth/login')
                return
            }

            setUser(userData)

            const { data: shopData } = await supabase
                .from('shops')
                .select('*')
                .eq('owner_id', authUser.id)
                .single()

            if (!shopData) {
                router.push('/shop-owner/create-shop')
                return
            }

            setShop(shopData)

            // Get orders
            const { data: ordersData } = await supabase
                .from('orders')
                .select(`
          *,
          order_items(
            quantity,
            unit_price,
            subtotal,
            shop_product:shop_products(
              global_product:global_products(name, base_unit)
            )
          )
        `)
                .eq('shop_id', shopData.id)
                .order('created_at', { ascending: false })

            if (ordersData) {
                setOrders(ordersData)
            }

            // Get delivery partners
            const { data: partnersData } = await supabase
                .from('users')
                .select('id, full_name')
                .eq('role', 'delivery_partner')

            if (partnersData) {
                setDeliveryPartners(partnersData)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setUpdatingOrderId(orderId)
        try {
            const response = await fetch(`/api/shop-owner/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!response.ok) throw new Error('Failed to update status')

            await loadData()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setUpdatingOrderId(null)
        }
    }

    const handleAssignDelivery = async (orderId: string, partnerId: string) => {
        setUpdatingOrderId(orderId)
        try {
            const response = await fetch(`/api/shop-owner/orders/${orderId}/assign-delivery`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliveryPartnerId: partnerId })
            })

            if (!response.ok) throw new Error('Failed to assign delivery partner')

            await loadData()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setUpdatingOrderId(null)
        }
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'pending': return 'warning'
            case 'confirmed':
            case 'preparing': return 'info'
            case 'ready':
            case 'out_for_delivery': return 'info'
            case 'delivered':
            case 'completed': return 'success'
            case 'cancelled': return 'danger'
            default: return 'default'
        }
    }

    const getNextStatus = (currentStatus: string, orderType: string) => {
        const statusFlow: Record<string, string> = {
            'pending': 'confirmed',
            'confirmed': 'preparing',
            'preparing': 'ready',
            'ready': orderType === 'delivery' ? 'out_for_delivery' : 'completed',
            'out_for_delivery': 'delivered'
        }
        return statusFlow[currentStatus]
    }

    const filteredOrders = selectedStatus === 'all'
        ? orders
        : orders.filter(o => o.status === selectedStatus)

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

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                    <p className="text-gray-600 mt-2">Process and manage customer orders</p>
                </div>

                {/* Status Filter */}
                <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                    {['all', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${selectedStatus === status
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="text-6xl mb-4">📦</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
                            <p className="text-gray-600">Orders will appear here when customers place them</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <Card key={order.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                                            <p className="text-sm text-gray-600 mt-1">{formatDateTime(order.created_at)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant={getStatusBadgeVariant(order.status)}>
                                                {order.status.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                            <Badge variant="default">
                                                {order.order_type.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Order Items */}
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                                            <div className="space-y-1">
                                                {order.order_items.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            {item.shop_product.global_product.name} × {item.quantity}
                                                        </span>
                                                        <span className="font-medium">{formatPrice(item.subtotal)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between mt-2 pt-2 border-t">
                                                <span className="font-semibold">Total:</span>
                                                <span className="font-semibold text-emerald-600">{formatPrice(order.total_amount)}</span>
                                            </div>
                                        </div>

                                        {/* Delivery Address */}
                                        {order.order_type === 'delivery' && (
                                            <div className="text-sm">
                                                <span className="text-gray-600">Delivery to: </span>
                                                <span className="font-medium">{order.delivery_address}</span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2 flex-wrap">
                                            {order.status !== 'completed' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                <>
                                                    {getNextStatus(order.status, order.order_type) && (
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => handleUpdateStatus(order.id, getNextStatus(order.status, order.order_type))}
                                                            isLoading={updatingOrderId === order.id}
                                                        >
                                                            Mark as {getNextStatus(order.status, order.order_type).replace('_', ' ')}
                                                        </Button>
                                                    )}

                                                    {order.status === 'ready' && order.order_type === 'delivery' && deliveryPartners.length > 0 && (
                                                        <select
                                                            onChange={(e) => handleAssignDelivery(order.id, e.target.value)}
                                                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
                                                            disabled={updatingOrderId === order.id}
                                                        >
                                                            <option value="">Assign Delivery Partner</option>
                                                            {deliveryPartners.map(partner => (
                                                                <option key={partner.id} value={partner.id}>
                                                                    {partner.full_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {order.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                                            isLoading={updatingOrderId === order.id}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
