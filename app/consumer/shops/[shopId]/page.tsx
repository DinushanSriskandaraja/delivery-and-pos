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

            {/* Shop Hero Section */}
            <div className="bg-emerald-900 text-emerald-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-800 rounded-full opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-emerald-950 rounded-full opacity-50 blur-3xl"></div>

                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <Link href="/consumer" className="inline-flex items-center text-emerald-200 hover:text-white mb-4 transition-colors">
                                ← Back to Shops
                            </Link>
                            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
                                {shop?.name}
                            </h1>
                            <div className="flex items-center gap-4 text-emerald-100 mb-4">
                                {shop?.rating > 0 ? (
                                    <div className="flex items-center text-sm font-medium bg-emerald-800/50 px-3 py-1 rounded-full backdrop-blur-sm border border-emerald-700">
                                        <span className="mr-1 text-yellow-400">★</span>
                                        <span>{shop.rating.toFixed(1)} ({shop.review_count} reviews)</span>
                                    </div>
                                ) : (
                                    <span className="text-sm bg-emerald-800/50 px-3 py-1 rounded-full border border-emerald-700">New Shop</span>
                                )}
                                <div className="text-sm font-medium flex items-center">
                                    <span className="mr-1">📍</span> {shop?.address}
                                </div>
                            </div>
                            <p className="text-lg text-emerald-100/90 max-w-2xl leading-relaxed">
                                {shop?.description}
                            </p>
                        </div>

                        {/* Cart Summary Card (Desktop) */}

                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6 relative z-20">
                <div className={`grid grid-cols-1 gap-8 ${cart.length > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1 space-y-6">

                        <Card className="shadow-lg border-0 ring-1 ring-black/5">
                            <CardHeader className="pb-3 border-b border-gray-100">
                                <CardTitle className="text-lg">Filters</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-5">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-400">🔍</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search items..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                            Categories
                                        </label>
                                        <div className="space-y-1">

                                            <button
                                                onClick={() => setSelectedCategory('all')}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group ${selectedCategory === 'all'
                                                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span>All Products</span>
                                                {selectedCategory === 'all' && <span className="text-emerald-500">●</span>}
                                            </button>
                                            {categories.map(category => (
                                                <button
                                                    key={category}
                                                    onClick={() => setSelectedCategory(category)}
                                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group ${selectedCategory === category
                                                        ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <span>{category}</span>
                                                    {selectedCategory === category && <span className="text-emerald-500">●</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Mobile Cart Summary */}
                        {cart.length > 0 && (
                            <Card className="lg:hidden shadow-lg border border-emerald-100 bg-emerald-50/50">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500">{getCartItemCount()} items</p>
                                            <p className="text-lg font-bold text-emerald-700">{formatPrice(getCartTotal())}</p>
                                        </div>
                                        <Link href="/consumer/cart">
                                            <Button variant="primary">
                                                Checkout
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Products Grid */}
                    <div className="lg:col-span-3">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">
                                {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}
                            </h2>
                            {selectedCategory !== 'all' && (
                                <span className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-medium">
                                    {selectedCategory}
                                </span>
                            )}
                        </div>

                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                                <div className="text-6xl mb-4 opacity-50">📦</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                                <p className="text-gray-600">Try searching for something else or change categories.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredProducts.map((product) => {
                                    const cartItem = cart.find(item => item.shop_product_id === product.id)
                                    const inCart = !!cartItem

                                    return (
                                        <Card key={product.id} hoverable className="h-full flex flex-col border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-visible">
                                            {/* Product Image area */}
                                            <div className="relative h-48 w-full bg-gray-100 rounded-t-xl overflow-hidden group">
                                                {product.global_product.image_url ? (
                                                    <img
                                                        src={product.global_product.image_url}
                                                        alt={product.global_product.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                                                        <span className="text-4xl">🥬</span>
                                                    </div>
                                                )}

                                                {/* Floating Badges */}
                                                <div className="absolute top-3 left-3 flex flex-col gap-2">
                                                    <Badge variant="default" className="bg-white/90 backdrop-blur-sm shadow-sm text-gray-700 font-medium">
                                                        {product.global_product.category}
                                                    </Badge>
                                                </div>
                                                <div className="absolute top-3 right-3">
                                                    <Badge variant={product.stock_quantity > 10 ? 'success' : 'warning'} className="shadow-sm">
                                                        {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <CardHeader className="pb-0 pt-4">
                                                <CardTitle className="text-lg text-gray-900 line-clamp-1">{product.global_product.name}</CardTitle>
                                                <CardDescription className="mt-1 text-sm line-clamp-2 min-h-[2.5em] text-gray-500">
                                                    {product.global_product.description}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="flex-grow flex flex-col justify-end pt-4">
                                                <div className="mb-4">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-bold text-emerald-700">
                                                            {formatPrice(product.price)}
                                                        </span>
                                                        <span className="text-sm text-gray-400 font-medium">
                                                            / {product.global_product.base_unit}
                                                        </span>
                                                    </div>
                                                </div>

                                                {inCart ? (
                                                    <div className="flex items-center justify-between bg-emerald-50 rounded-xl p-1.5 border border-emerald-100 shadow-inner">
                                                        <button
                                                            onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                                                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white shadow-sm hover:shadow-md text-emerald-700 transition-all font-bold"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="font-bold text-emerald-900 w-8 text-center text-lg">
                                                            {cartItem.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                                                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-600 shadow-sm hover:bg-emerald-700 text-white transition-all font-bold"
                                                            disabled={cartItem.quantity >= product.stock_quantity}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="primary"
                                                        className="w-full shadow-lg shadow-emerald-100 py-6 text-base font-semibold rounded-xl hover:translate-y-0.5 active:translate-y-1"
                                                        onClick={() => addToCart(product)}
                                                        disabled={product.stock_quantity <= 0}
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

                    {/* Right Sidebar - Cart (Desktop) */}
                    {cart.length > 0 && (
                        <div className="hidden lg:block lg:col-span-1 space-y-6">
                            <Card className="shadow-lg border-0 ring-1 ring-black/5 sticky top-24">
                                <CardHeader className="pb-3 border-b border-gray-100">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        🛒 Your Cart
                                        <span className="text-sm font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-auto">
                                            {getCartItemCount()} items
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-4">
                                        <div className="max-h-[calc(100vh-300px)] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                            {cart.map((item) => (
                                                <div key={item.shop_product_id} className="flex justify-between items-start text-sm pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                                    <div className="flex-1 pr-3">
                                                        <div className="font-medium text-gray-900 line-clamp-2">
                                                            {item.product.global_product.name}
                                                        </div>
                                                        <div className="text-gray-500 text-xs mt-1">
                                                            {item.quantity} × {formatPrice(item.product.price)}
                                                        </div>
                                                    </div>
                                                    <div className="font-semibold text-gray-900">
                                                        {formatPrice(item.product.price * item.quantity)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-gray-600 font-medium">Total</span>
                                                <span className="text-xl font-bold text-emerald-700">
                                                    {formatPrice(getCartTotal())}
                                                </span>
                                            </div>
                                            <Link href="/consumer/cart">
                                                <Button className="w-full font-bold shadow-md hover:shadow-lg transition-all">
                                                    Checkout →
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
