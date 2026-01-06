'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Badge from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

interface ShopProduct {
    id: string
    price: number
    stock_quantity: number
    is_available: boolean
    global_product: {
        id: string
        name: string
        description: string
        category: string
        base_unit: string
        image_url: string
    }
}

interface CartItem {
    shop_product_id: string
    quantity: number
    product: ShopProduct
}

export default function ShopDetailPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const shopId = params.shopId as string

    const [user, setUser] = useState<any>(null)
    const [shop, setShop] = useState<any>(null)
    const [products, setProducts] = useState<ShopProduct[]>([])
    const [filteredProducts, setFilteredProducts] = useState<ShopProduct[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [categories, setCategories] = useState<string[]>([])

    useEffect(() => {
        loadData()
        loadCart()
    }, [shopId])

    useEffect(() => {
        filterProducts()
    }, [products, searchQuery, selectedCategory])

    const loadData = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                setUser(userData)
            }

            // Load shop details
            const { data: shopData } = await supabase
                .from('shops')
                .select('*')
                .eq('id', shopId)
                .single()

            if (!shopData) {
                router.push('/consumer')
                return
            }

            // Load shop rating
            const { data: reviews } = await supabase
                .from('shop_reviews')
                .select('rating')
                .eq('shop_id', shopId)

            const rating = reviews && reviews.length > 0
                ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
                : 0

            setShop({
                ...shopData,
                rating: Math.round(rating * 10) / 10,
                review_count: reviews?.length || 0
            })

            // Load products
            const { data: productsData } = await supabase
                .from('shop_products')
                .select(`
          *,
          global_product:global_products(*)
        `)
                .eq('shop_id', shopId)
                .eq('is_available', true)
                .gt('stock_quantity', 0)

            if (productsData) {
                setProducts(productsData as any)

                // Extract unique categories
                const uniqueCategories = [...new Set(
                    productsData.map((p: any) => p.global_product.category)
                )] as string[]
                setCategories(uniqueCategories)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const loadCart = () => {
        const savedCart = localStorage.getItem(`cart_${shopId}`)
        if (savedCart) {
            setCart(JSON.parse(savedCart))
        }
    }

    const saveCart = (newCart: CartItem[]) => {
        localStorage.setItem(`cart_${shopId}`, JSON.stringify(newCart))
        setCart(newCart)
    }

    const filterProducts = () => {
        let filtered = products

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.global_product.category === selectedCategory)
        }

        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.global_product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.global_product.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        setFilteredProducts(filtered)
    }

    const addToCart = (product: ShopProduct) => {
        const existingItem = cart.find(item => item.shop_product_id === product.id)

        if (existingItem) {
            const newCart = cart.map(item =>
                item.shop_product_id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
            saveCart(newCart)
        } else {
            saveCart([...cart, { shop_product_id: product.id, quantity: 1, product }])
        }
    }

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }

        const newCart = cart.map(item =>
            item.shop_product_id === productId
                ? { ...item, quantity }
                : item
        )
        saveCart(newCart)
    }

    const removeFromCart = (productId: string) => {
        saveCart(cart.filter(item => item.shop_product_id !== productId))
    }

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
    }

    const getCartItemCount = () => {
        return cart.reduce((total, item) => total + item.quantity, 0)
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
                {/* Shop Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl">{shop?.name}</CardTitle>
                                <CardDescription className="mt-2">{shop?.description}</CardDescription>
                                <div className="mt-4 flex items-center gap-4">
                                    {shop?.rating > 0 ? (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <span className="mr-1">⭐</span>
                                            <span>{shop.rating.toFixed(1)} ({shop.review_count} reviews)</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-500">No reviews yet</span>
                                    )}
                                    <div className="text-sm text-gray-600">
                                        📍 {shop?.address}
                                    </div>
                                </div>
                            </div>
                            <Link href="/consumer">
                                <Button variant="outline">← Back to Shops</Button>
                            </Link>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Filters</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Input
                                        label="Search Products"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category
                                        </label>
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => setSelectedCategory('all')}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCategory === 'all'
                                                    ? 'bg-emerald-100 text-emerald-700 font-medium'
                                                    : 'hover:bg-gray-100'
                                                    }`}
                                            >
                                                All Products
                                            </button>
                                            {categories.map(category => (
                                                <button
                                                    key={category}
                                                    onClick={() => setSelectedCategory(category)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCategory === category
                                                        ? 'bg-emerald-100 text-emerald-700 font-medium'
                                                        : 'hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {category}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Cart Summary */}
                        {cart.length > 0 && (
                            <Card className="mt-4">
                                <CardHeader>
                                    <CardTitle>Cart Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Items:</span>
                                            <span className="font-medium">{getCartItemCount()}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-semibold">
                                            <span>Total:</span>
                                            <span className="text-emerald-600">{formatPrice(getCartTotal())}</span>
                                        </div>
                                        <Link href="/consumer/cart">
                                            <Button variant="primary" className="w-full mt-4">
                                                View Cart & Checkout
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Products Grid */}
                    <div className="lg:col-span-3">
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}
                            </h2>
                        </div>

                        {filteredProducts.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <div className="text-6xl mb-4">📦</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                                    <p className="text-gray-600">Try adjusting your filters</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredProducts.map((product) => {
                                    const cartItem = cart.find(item => item.shop_product_id === product.id)
                                    const inCart = !!cartItem

                                    return (
                                        <Card key={product.id}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-base">{product.global_product.name}</CardTitle>
                                                        <CardDescription className="mt-1 text-xs">
                                                            {product.global_product.description}
                                                        </CardDescription>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-2xl font-bold text-emerald-600">
                                                            {formatPrice(product.price)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">per {product.global_product.base_unit}</p>
                                                    </div>
                                                    <Badge variant={product.stock_quantity > 10 ? 'success' : 'warning'}>
                                                        {product.stock_quantity} in stock
                                                    </Badge>
                                                </div>
                                            </CardHeader>

                                            <CardContent>
                                                {inCart ? (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                                                        >
                                                            −
                                                        </Button>
                                                        <span className="flex-1 text-center font-medium">{cartItem.quantity}</span>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                                                            disabled={cartItem.quantity >= product.stock_quantity}
                                                        >
                                                            +
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => removeFromCart(product.id)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="primary"
                                                        className="w-full"
                                                        onClick={() => addToCart(product)}
                                                    >
                                                        Add to Cart
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
