import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ProductRequestCard from '@/components/admin/ProductRequestCard'

export default async function AdminProductsPage() {
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

    // Get all global products
    const { data: products } = await supabase
        .from('global_products')
        .select('*, users(full_name)')
        .order('created_at', { ascending: false })

    // Get product requests
    const { data: requests } = await supabase
        .from('product_requests')
        .select('*, shops(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={userData} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Product Catalog Management</h1>
                    <p className="text-gray-600 mt-2">Manage global products and approve requests</p>
                </div>

                {/* Product Requests */}
                {requests && requests.length > 0 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Pending Product Requests</CardTitle>
                            <CardDescription>New product requests from shop owners</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {requests.map((request: any) => (
                                    <ProductRequestCard key={request.id} request={request} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Global Products */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Global Product Catalog</CardTitle>
                                <CardDescription>{products?.length || 0} products</CardDescription>
                            </div>
                            <Link href="/admin/products/new">
                                <Button variant="primary">+ Add Product</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {products && products.length > 0 ? (
                            <div className="space-y-3">
                                {products.map((product: any) => (
                                    <div key={product.id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                                <Badge variant={product.is_approved ? 'success' : 'warning'}>
                                                    {product.is_approved ? 'Approved' : 'Pending'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                <span>Category: {product.category}</span>
                                                <span>•</span>
                                                <span>Unit: {product.base_unit}</span>
                                                <span>•</span>
                                                <span>Created by: {product.users?.full_name}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline">Edit</Button>
                                            {!product.is_approved && (
                                                <Button size="sm" variant="primary">Approve</Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📦</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
                                <p className="text-gray-600 mb-4">Start by adding your first product</p>
                                <Link href="/admin/products/new">
                                    <Button variant="primary">+ Add Product</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
