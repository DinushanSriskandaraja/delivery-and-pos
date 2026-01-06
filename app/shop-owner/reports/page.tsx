'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatPrice } from '@/lib/utils'

export default function ShopOwnerReportsPage() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [shop, setShop] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        todayOrders: 0,
        todayRevenue: 0,
        topProducts: [] as any[]
    })

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

            // Get all orders
            const { data: orders } = await supabase
                .from('orders')
                .select('total_amount, created_at')
                .eq('shop_id', shopData.id)
                .in('status', ['completed', 'delivered'])

            if (orders) {
                const today = new Date().toDateString()
                const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today)

                setStats(prev => ({
                    ...prev,
                    totalOrders: orders.length,
                    totalRevenue: orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
                    todayOrders: todayOrders.length,
                    todayRevenue: todayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
                }))
            }

            // Get top products
            const { data: orderItems } = await supabase
                .from('order_items')
                .select(`
          quantity,
          subtotal,
          shop_product:shop_products(
            global_product:global_products(name)
          ),
          order:orders!inner(shop_id, status)
        `)
                .eq('order.shop_id', shopData.id)
                .in('order.status', ['completed', 'delivered'])

            if (orderItems) {
                const productStats: Record<string, { name: string, quantity: number, revenue: number }> = {}

                orderItems.forEach((item: any) => {
                    const name = item.shop_product.global_product.name
                    if (!productStats[name]) {
                        productStats[name] = { name, quantity: 0, revenue: 0 }
                    }
                    productStats[name].quantity += item.quantity
                    productStats[name].revenue += Number(item.subtotal)
                })

                const topProducts = Object.values(productStats)
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5)

                setStats(prev => ({ ...prev, topProducts }))
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Sales Reports</h1>
                    <p className="text-gray-600 mt-2">View your shop performance</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Total Orders</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Total Revenue</p>
                                <p className="text-3xl font-bold text-emerald-600 mt-2">{formatPrice(stats.totalRevenue)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Today's Orders</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayOrders}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Today's Revenue</p>
                                <p className="text-3xl font-bold text-emerald-600 mt-2">{formatPrice(stats.todayRevenue)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.topProducts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No sales data yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.topProducts.map((product, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                                <p className="text-sm text-gray-600">Sold: {product.quantity} units</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600">{formatPrice(product.revenue)}</p>
                                            <p className="text-xs text-gray-500">Revenue</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
