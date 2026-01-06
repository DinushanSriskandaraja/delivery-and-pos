import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default async function AdminDashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        redirect('/auth/login')
    }

    // Get statistics
    const [shopsData, productsData, ordersData, usersData] = await Promise.all([
        supabase.from('shops').select('*', { count: 'exact' }),
        supabase.from('global_products').select('*', { count: 'exact' }),
        supabase.from('orders').select('*', { count: 'exact' }),
        supabase.from('users').select('*', { count: 'exact' }),
    ])

    const stats = [
        { label: 'Total Shops', value: shopsData.count || 0, link: '/admin/shops', icon: '🏪' },
        { label: 'Global Products', value: productsData.count || 0, link: '/admin/products', icon: '📦' },
        { label: 'Total Orders', value: ordersData.count || 0, link: '/admin', icon: '🛒' },
        { label: 'Total Users', value: usersData.count || 0, link: '/admin/users', icon: '👥' },
    ]

    // Get pending approvals
    const { data: pendingShops } = await supabase
        .from('shops')
        .select('*, users(full_name)')
        .eq('is_approved', false)
        .limit(5)

    const { data: pendingProducts } = await supabase
        .from('product_requests')
        .select('*, shops(name)')
        .eq('status', 'pending')
        .limit(5)

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={userData} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage your GroceryShop platform</p>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <Link key={index} href={stat.link}>
                            <Card hoverable>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                                        </div>
                                        <div className="text-4xl">{stat.icon}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Shop Approvals */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Shop Approvals</CardTitle>
                            <CardDescription>Shops waiting for approval</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingShops && pendingShops.length > 0 ? (
                                <div className="space-y-4">
                                    {pendingShops.map((shop: any) => (
                                        <div key={shop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">{shop.name}</p>
                                                <p className="text-sm text-gray-600">{shop.users?.full_name}</p>
                                            </div>
                                            <Link href="/admin/shops">
                                                <Button size="sm" variant="outline">Review</Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No pending approvals</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pending Product Requests */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Product Requests</CardTitle>
                            <CardDescription>New product requests from shop owners</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingProducts && pendingProducts.length > 0 ? (
                                <div className="space-y-4">
                                    {pendingProducts.map((request: any) => (
                                        <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">{request.product_name}</p>
                                                <p className="text-sm text-gray-600">{request.shops?.name}</p>
                                            </div>
                                            <Link href="/admin/products">
                                                <Button size="sm" variant="outline">Review</Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No pending requests</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link href="/admin/products">
                            <Card hoverable>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">📦</div>
                                        <p className="font-medium text-gray-900">Manage Products</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/admin/shops">
                            <Card hoverable>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">🏪</div>
                                        <p className="font-medium text-gray-900">Manage Shops</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/admin/users">
                            <Card hoverable>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">👥</div>
                                        <p className="font-medium text-gray-900">Manage Users</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
