'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatPrice } from '@/lib/utils'

interface CartItem {
    shopProductId: string
    name: string
    price: number
    quantity: number
    subtotal: number
    unit: string
}

export default function POSPage() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [shop, setShop] = useState<any>(null)
    const [products, setProducts] = useState<any[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')

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

            // Get available products
            const { data: productsData } = await supabase
                .from('shop_products')
                .select('*, global_product:global_products(*)')
                .eq('shop_id', shopData.id)
                .eq('is_available', true)
                .gt('stock_quantity', 0)
                .order('global_product(name)')

            if (productsData) {
                setProducts(productsData)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const addToCart = (product: any) => {
        const existing = cart.find(item => item.shopProductId === product.id)

        if (existing) {
            if (existing.quantity >= product.stock_quantity) {
                alert('Not enough stock')
                return
            }
            setCart(cart.map(item =>
                item.shopProductId === product.id
                    ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
                    : item
            ))
        } else {
            setCart([...cart, {
                shopProductId: product.id,
                name: product.global_product.name,
                price: product.price,
                quantity: 1,
                subtotal: product.price,
                unit: product.global_product.base_unit
            }])
        }
    }

    const updateQuantity = (shopProductId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(shopProductId)
            return
        }

        const product = products.find(p => p.id === shopProductId)
        if (product && newQuantity > product.stock_quantity) {
            alert('Not enough stock')
            return
        }

        setCart(cart.map(item =>
            item.shopProductId === shopProductId
                ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.price }
                : item
        ))
    }

    const removeFromCart = (shopProductId: string) => {
        setCart(cart.filter(item => item.shopProductId !== shopProductId))
    }

    const clearCart = () => {
        setCart([])
    }

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.subtotal, 0)
    }

    const handleCheckout = async () => {
        if (cart.length === 0) {
            alert('Cart is empty')
            return
        }

        setIsProcessing(true)
        try {
            const response = await fetch('/api/shop-owner/pos/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    paymentMethod
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to process order')
            }

            const { orderId } = await response.json()

            // Clear cart and show success
            clearCart()
            alert(`Order completed! Order ID: ${orderId.slice(0, 8)}`)

            // Reload products to update stock
            await loadData()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsProcessing(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.global_product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                    <h1 className="text-3xl font-bold text-gray-900">Point of Sale (POS)</h1>
                    <p className="text-gray-600 mt-2">Process walk-in customer orders</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Products */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Products</CardTitle>
                                <Input
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="mt-2"
                                />
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                                    {filteredProducts.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-emerald-500 transition-colors text-left"
                                        >
                                            <h3 className="font-semibold text-gray-900 text-sm">{product.global_product.name}</h3>
                                            <p className="text-emerald-600 font-bold mt-1">{formatPrice(product.price)}</p>
                                            <p className="text-xs text-gray-500 mt-1">Stock: {product.stock_quantity} {product.global_product.base_unit}</p>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Cart */}
                    <div>
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Cart</CardTitle>
                                    {cart.length > 0 && (
                                        <Button size="sm" variant="ghost" onClick={clearCart}>
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {cart.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>Cart is empty</p>
                                        <p className="text-sm mt-1">Add products to start</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                                            {cart.map((item) => (
                                                <div key={item.shopProductId} className="p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-medium text-sm">{item.name}</h4>
                                                        <button
                                                            onClick={() => removeFromCart(item.shopProductId)}
                                                            className="text-red-500 hover:text-red-700 text-xs"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => updateQuantity(item.shopProductId, item.quantity - 1)}
                                                                className="w-6 h-6 bg-white border rounded flex items-center justify-center text-sm"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.shopProductId, item.quantity + 1)}
                                                                className="w-6 h-6 bg-white border rounded flex items-center justify-center text-sm"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <span className="font-semibold text-sm">{formatPrice(item.subtotal)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Total */}
                                        <div className="border-t pt-4 mb-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-lg font-bold">Total:</span>
                                                <span className="text-2xl font-bold text-emerald-600">{formatPrice(calculateTotal())}</span>
                                            </div>

                                            {/* Payment Method */}
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Payment Method:</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => setPaymentMethod('cash')}
                                                        className={`p-2 rounded-lg border-2 text-sm font-medium ${paymentMethod === 'cash'
                                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                                : 'border-gray-200 text-gray-700'
                                                            }`}
                                                    >
                                                        💵 Cash
                                                    </button>
                                                    <button
                                                        onClick={() => setPaymentMethod('card')}
                                                        className={`p-2 rounded-lg border-2 text-sm font-medium ${paymentMethod === 'card'
                                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                                : 'border-gray-200 text-gray-700'
                                                            }`}
                                                    >
                                                        💳 Card
                                                    </button>
                                                </div>
                                            </div>

                                            <Button
                                                variant="primary"
                                                className="w-full"
                                                onClick={handleCheckout}
                                                isLoading={isProcessing}
                                            >
                                                Complete Sale
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
