import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'

export default async function ShopOwnerDashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!userData || userData.role !== 'shop_owner') {
        redirect('/auth/login')
    }

    // Get shop data
    const { data: shop } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .single()

    // Get shop statistics if shop exists
    let stats = {
        products: 0,
        orders: 0,
        revenue: 0
    }

    if (shop) {
        const [productsData, ordersData] = await Promise.all([
            supabase
                .from('shop_products')
                .select('*', { count: 'exact' })
                .eq('shop_id', shop.id),
            supabase
                .from('orders')
                .select('total_amount')
                .eq('shop_id', shop.id)
        ])

        stats.products = productsData.count || 0
        stats.orders = ordersData.data?.length || 0
        stats.revenue = ordersData.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={userData} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Shop Owner Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage your shop and products</p>
                </div>

                {!shop ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="text-6xl mb-4">🏪</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Shop Yet</h2>
                            <p className="text-gray-600 mb-6">Create your shop to start selling</p>
                            <Link href="/shop-owner/create-shop">
                                <Button variant="primary">Create Shop</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Shop Status */}
                        <Card className="mb-6">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{shop.name}</CardTitle>
                                        <CardDescription className="mt-2">{shop.description}</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant={shop.is_approved ? 'success' : 'warning'}>
                                            {shop.is_approved ? 'Approved' : 'Pending Approval'}
                                        </Badge>
                                        <Badge variant={shop.is_active ? 'success' : 'danger'}>
                                            {shop.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">📍 {shop.address}</p>
                            </CardContent>
                        </Card>

                        {/* Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Products</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.products}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Orders</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.orders}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Revenue</p>
                                        <p className="text-3xl font-bold text-emerald-600 mt-2">
                                            LKR {stats.revenue.toFixed(2)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card hoverable>
                                <CardContent className="pt-6 text-center">
                                    <div className="text-5xl mb-3">📦</div>
                                    <h3 className="font-semibold text-gray-900">Manage Products</h3>
                                    <p className="text-sm text-gray-600 mt-1">Add and update your inventory</p>
                                    <Button variant="outline" className="mt-4 w-full">View Products</Button>
                                </CardContent>
                            </Card>

                            <Card hoverable>
                                <CardContent className="pt-6 text-center">
                                    <div className="text-5xl mb-3">🛒</div>
                                    <h3 className="font-semibold text-gray-900">Orders</h3>
                                    <p className="text-sm text-gray-600 mt-1">View and manage orders</p>
                                    <Button variant="outline" className="mt-4 w-full">View Orders</Button>
                                </CardContent>
                            </Card>

                            <Card hoverable>
                                <CardContent className="pt-6 text-center">
                                    <div className="text-5xl mb-3">⚙️</div>
                                    <h3 className="font-semibold text-gray-900">Settings</h3>
                                    <p className="text-sm text-gray-600 mt-1">Update shop information</p>
                                    <Button variant="outline" className="mt-4 w-full">Shop Settings</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}
