'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatPrice } from '@/lib/utils'
import ProductForm from '@/components/products/ProductForm'

export default function ShopOwnerProductsPage() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [shop, setShop] = useState<any>(null)
    const [shopProducts, setShopProducts] = useState<any[]>([])
    const [globalProducts, setGlobalProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'inventory' | 'catalog'>('inventory')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [selectedGlobalProduct, setSelectedGlobalProduct] = useState<any>(null)

    // Form states
    const [addForm, setAddForm] = useState({ price: '', stock: '' })
    const [editForm, setEditForm] = useState({ price: '', stock: '', isAvailable: true })
    // No longer need requestForm state as it's handled by ProductForm

    const [isSubmitting, setIsSubmitting] = useState(false)

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

            // Get shop
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

            // Get shop products
            const { data: shopProductsData, error } = await supabase
                .from('shop_products')
                .select('*, global_product:global_products(*)')
                .eq('shop_id', shopData.id)
                .order('updated_at', { ascending: false })

            if (error) {
                console.error('Error fetching shop products:', error)
            }

            if (shopProductsData) {
                console.log('Shop ID:', shopData.id)
                console.log('Fetched Shop Products:', shopProductsData)
                setShopProducts(shopProductsData)
            } else {
                console.log('No shop products found or error')
            }

            // Get global products
            const { data: globalProductsData } = await supabase
                .from('global_products')
                .select('*')
                .eq('is_approved', true)
                .order('name')

            if (globalProductsData) {
                setGlobalProducts(globalProductsData)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddProduct = async () => {
        if (!selectedGlobalProduct) return

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/shop-owner/products/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    globalProductId: selectedGlobalProduct.id,
                    price: parseFloat(addForm.price),
                    stockQuantity: parseInt(addForm.stock)
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to add product')
            }

            setShowAddModal(false)
            setAddForm({ price: '', stock: '' })
            setSelectedGlobalProduct(null)
            await loadData()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateProduct = async () => {
        if (!selectedProduct) return

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/shop-owner/products/${selectedProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    price: parseFloat(editForm.price),
                    stockQuantity: parseInt(editForm.stock),
                    isAvailable: editForm.isAvailable
                })
            })

            if (!response.ok) throw new Error('Failed to update product')

            setShowEditModal(false)
            setSelectedProduct(null)
            await loadData()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRequestSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/shop-owner/products/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: formData.get('name'),
                    description: formData.get('description'),
                    category: formData.get('category'),
                    baseUnit: formData.get('base_unit')
                })
            })

            if (!response.ok) throw new Error('Failed to submit request')

            setShowRequestModal(false)
            alert('Product request submitted! Admin will review it.')
        } catch (error: any) {
            return { error: error.message }
        } finally {
            setIsSubmitting(false)
        }
    }

    const openAddModal = (product: any) => {
        setSelectedGlobalProduct(product)
        setAddForm({ price: '', stock: '0' })
        setShowAddModal(true)
    }

    const openEditModal = (product: any) => {
        setSelectedProduct(product)
        setEditForm({
            price: product.price.toString(),
            stock: product.stock_quantity.toString(),
            isAvailable: product.is_available
        })
        setShowEditModal(true)
    }

    const categories = ['all', ...new Set(globalProducts.map(p => p.category))]

    const filteredGlobalProducts = globalProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
        const notInShop = !shopProducts.some(sp => sp.global_product_id === p.id)
        return matchesSearch && matchesCategory && notInShop
    })

    const filteredShopProducts = shopProducts.filter(p => {
        const name = p.global_product?.name || 'Unknown Product'
        return name.toLowerCase().includes(searchQuery.toLowerCase())
    })

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

    if (!shop?.is_approved) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header user={user} />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="text-6xl mb-4">⏳</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop Pending Approval</h2>
                            <p className="text-gray-600">Your shop is awaiting admin approval before you can add products.</p>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
                        <p className="text-gray-600 mt-2">Manage your shop inventory</p>
                    </div>
                    <Button variant="primary" onClick={() => setShowRequestModal(true)}>
                        + Request New Product
                    </Button>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`pb-3 px-1 border-b-2 font-medium ${activeTab === 'inventory'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            My Inventory ({shopProducts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('catalog')}
                            className={`pb-3 px-1 border-b-2 font-medium ${activeTab === 'catalog'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Add from Catalog
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {activeTab === 'inventory' ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Shop Inventory</CardTitle>
                            <CardDescription>Products available in your shop</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredShopProducts.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📦</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
                                    <p className="text-gray-600 mb-4">Add products from the catalog to start selling</p>
                                    <Button variant="primary" onClick={() => setActiveTab('catalog')}>
                                        Browse Catalog
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredShopProducts.map((product) => (
                                        <div key={product.id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-semibold text-gray-900">{product.global_product?.name || 'Unknown Product'}</h3>
                                                    <Badge variant={product.is_available ? 'success' : 'danger'}>
                                                        {product.is_available ? 'Available' : 'Unavailable'}
                                                    </Badge>
                                                    {product.stock_quantity <= 10 && (
                                                        <Badge variant="warning">Low Stock</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{product.global_product?.description}</p>
                                                <div className="flex items-center gap-4 mt-2 text-sm">
                                                    <span className="text-gray-500">Price: <span className="font-medium text-emerald-600">{formatPrice(product.price)}</span></span>
                                                    <span className="text-gray-500">Stock: <span className="font-medium">{product.stock_quantity} {product.global_product?.base_unit}</span></span>
                                                    <span className="text-gray-500">Category: {product.global_product?.category}</span>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => openEditModal(product)}>
                                                Edit
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Category Filter */}
                        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${selectedCategory === cat
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {cat === 'all' ? 'All' : cat}
                                </button>
                            ))}
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Global Product Catalog</CardTitle>
                                <CardDescription>Add products to your shop</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {filteredGlobalProducts.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-600">No products found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredGlobalProducts.map((product) => (
                                            <div key={product.id} className="p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                                                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                                            <span>Category: {product.category}</span>
                                                            <span>•</span>
                                                            <span>Unit: {product.base_unit}</span>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" variant="primary" onClick={() => openAddModal(product)}>
                                                        Add
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Add Product Modal */}
                {showAddModal && selectedGlobalProduct && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <Card className="max-w-md w-full">
                            <CardHeader>
                                <CardTitle>Add {selectedGlobalProduct.name}</CardTitle>
                                <CardDescription>Set price and initial stock</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Input
                                        label="Price (LKR)"
                                        type="number"
                                        step="0.01"
                                        value={addForm.price}
                                        onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label={`Stock Quantity (${selectedGlobalProduct.base_unit})`}
                                        type="number"
                                        value={addForm.stock}
                                        onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })}
                                        required
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="primary"
                                            className="flex-1"
                                            onClick={handleAddProduct}
                                            isLoading={isSubmitting}
                                        >
                                            Add Product
                                        </Button>
                                        <Button variant="outline" onClick={() => setShowAddModal(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Edit Product Modal */}
                {showEditModal && selectedProduct && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <Card className="max-w-md w-full">
                            <CardHeader>
                                <CardTitle>Edit {selectedProduct.global_product.name}</CardTitle>
                                <CardDescription>Update price, stock, and availability</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Input
                                        label="Price (LKR)"
                                        type="number"
                                        step="0.01"
                                        value={editForm.price}
                                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label={`Stock Quantity (${selectedProduct.global_product.base_unit})`}
                                        type="number"
                                        value={editForm.stock}
                                        onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                                        required
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="available"
                                            checked={editForm.isAvailable}
                                            onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.checked })}
                                            className="rounded"
                                        />
                                        <label htmlFor="available" className="text-sm text-gray-700">
                                            Available for sale
                                        </label>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="primary"
                                            className="flex-1"
                                            onClick={handleUpdateProduct}
                                            isLoading={isSubmitting}
                                        >
                                            Update Product
                                        </Button>
                                        <Button variant="outline" onClick={() => setShowEditModal(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Request Product Modal */}
                {showRequestModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <Card className="max-w-md w-full">
                            <CardHeader>
                                <CardTitle>Request New Product</CardTitle>
                                <CardDescription>Request admin to add a new product to the catalog</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ProductForm
                                    onSubmit={handleRequestSubmit}
                                    submitLabel="Submit Request"
                                    showImageUpload={false}
                                    onCancel={() => setShowRequestModal(false)}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    )
}
