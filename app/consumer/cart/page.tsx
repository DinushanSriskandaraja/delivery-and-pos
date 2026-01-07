'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

interface CartItem {
    shop_product_id: string
    quantity: number
    product: {
        id: string
        price: number
        stock_quantity: number
        global_product: {
            name: string
            description: string
            base_unit: string
        }
    }
}

export default function CartPage() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [cart, setCart] = useState<CartItem[]>([])
    const [shop, setShop] = useState<any>(null)
    const [shopId, setShopId] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery')
    const [deliveryAddress, setDeliveryAddress] = useState('')
    const [savedAddresses, setSavedAddresses] = useState<any[]>([])
    const [guestForm, setGuestForm] = useState({ name: '', email: '', phone: '' })
    const [error, setError] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (shop?.delivery_range_km === 0) {
            setOrderType('pickup')
        }
    }, [shop])

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

                // Load saved addresses
                const { data: addresses } = await supabase
                    .from('consumer_addresses')
                    .select('*')
                    .eq('consumer_id', authUser.id)
                    .order('is_default', { ascending: false })

                if (addresses) {
                    setSavedAddresses(addresses)
                    const defaultAddress = addresses.find(a => a.is_default)
                    if (defaultAddress) {
                        setDeliveryAddress(defaultAddress.address)
                    }
                }
            }



            // Find cart in localStorage (check all shops)
            const keys = Object.keys(localStorage)
            const cartKey = keys.find(key => key.startsWith('cart_'))

            if (cartKey) {
                const id = cartKey.replace('cart_', '')
                setShopId(id)
                const savedCart = localStorage.getItem(cartKey)
                if (savedCart) {
                    setCart(JSON.parse(savedCart))

                    // Load shop details
                    const { data: shopData } = await supabase
                        .from('shops')
                        .select('*')
                        .eq('id', id)
                        .single()

                    setShop(shopData)
                }
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
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
        const newCart = cart.filter(item => item.shop_product_id !== productId)
        saveCart(newCart)
    }

    const saveCart = (newCart: CartItem[]) => {
        if (newCart.length === 0) {
            localStorage.removeItem(`cart_${shopId}`)
            setCart([])
        } else {
            localStorage.setItem(`cart_${shopId}`, JSON.stringify(newCart))
            setCart(newCart)
        }
    }

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
    }

    const handlePlaceOrder = async () => {
        setError('')

        if (orderType === 'delivery' && !deliveryAddress.trim()) {
            setError('Please enter a delivery address')
            return
        }

        if (!user) {
            if (!guestForm.name || !guestForm.email || !guestForm.phone) {
                setError('Please fill in all guest details')
                return
            }
        }

        setIsSubmitting(true)

        try {
            const total = getCartTotal()

            // Create order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    consumer_id: user?.id || null,
                    shop_id: shopId,
                    order_type: orderType,
                    status: 'pending',
                    total_amount: total,
                    delivery_address: orderType === 'delivery' ? deliveryAddress : null,
                    guest_name: !user ? guestForm.name : null,
                    guest_email: !user ? guestForm.email : null,
                    guest_phone: !user ? guestForm.phone : null,
                })
                .select()
                .single()

            if (orderError) throw orderError

            // Create order items
            const orderItems = cart.map(item => ({
                order_id: orderData.id,
                shop_product_id: item.shop_product_id,
                quantity: item.quantity,
                unit_price: item.product.price,
                subtotal: item.product.price * item.quantity
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)

            if (itemsError) throw itemsError

            // Update stock quantities
            for (const item of cart) {
                const { error: stockError } = await supabase
                    .from('shop_products')
                    .update({
                        stock_quantity: item.product.stock_quantity - item.quantity
                    })
                    .eq('id', item.shop_product_id)

                if (stockError) throw stockError
            }

            // Clear cart
            localStorage.removeItem(`cart_${shopId}`)

            // Save guest order ID for persistence
            if (!user) {
                localStorage.setItem('guest_last_order_id', orderData.id)
            }

            // Redirect to orders page
            router.push(`/consumer/orders?success=true&orderId=${orderData.id}`)
        } catch (err: any) {
            console.error('Error placing order:', err)
            setError(err.message || 'Failed to place order')
        } finally {
            setIsSubmitting(false)
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

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header user={user} />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="text-6xl mb-4">🛒</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                            <p className="text-gray-600 mb-6">Add some products to get started</p>
                            <Link href="/consumer">
                                <Button variant="primary">Browse Shops</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
            <Header user={user} />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Items from {shop?.name}</CardTitle>
                                <CardDescription>{cart.length} item{cart.length !== 1 ? 's' : ''}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {cart.map((item) => (
                                        <div key={item.shop_product_id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{item.product.global_product.name}</h3>
                                                <p className="text-sm text-gray-600">{item.product.global_product.description}</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {formatPrice(item.product.price)} per {item.product.global_product.base_unit}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateQuantity(item.shop_product_id, item.quantity - 1)}
                                                >
                                                    −
                                                </Button>
                                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateQuantity(item.shop_product_id, item.quantity + 1)}
                                                    disabled={item.quantity >= item.product.stock_quantity}
                                                >
                                                    +
                                                </Button>
                                            </div>

                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">
                                                    {formatPrice(item.product.price * item.quantity)}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeFromCart(item.shop_product_id)}
                                                    className="text-red-600 hover:text-red-700 mt-1"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary & Checkout */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Order Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Order Type
                                        </label>
                                        <div className="space-y-2">
                                            {shop?.delivery_range_km !== 0 && (
                                                <button
                                                    onClick={() => setOrderType('delivery')}
                                                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${orderType === 'delivery'
                                                        ? 'border-emerald-500 bg-emerald-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center">
                                                        <span className="text-2xl mr-3">🚚</span>
                                                        <div>
                                                            <p className="font-medium">Home Delivery</p>
                                                            <p className="text-xs text-gray-600">Get it delivered to your door</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setOrderType('pickup')}
                                                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${orderType === 'pickup'
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-3">🏪</span>
                                                    <div>
                                                        <p className="font-medium">Pickup</p>
                                                        <p className="text-xs text-gray-600">Collect from shop</p>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Delivery Address */}
                                    {orderType === 'delivery' && (
                                        <div>
                                            <Input
                                                label="Delivery Address"
                                                value={deliveryAddress}
                                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                                placeholder="Enter your delivery address"
                                                required
                                            />

                                            {savedAddresses.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-xs text-gray-600 mb-1">Saved addresses:</p>
                                                    <div className="space-y-1">
                                                        {savedAddresses.map(addr => (
                                                            <button
                                                                key={addr.id}
                                                                onClick={() => setDeliveryAddress(addr.address)}
                                                                className="w-full text-left text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                                                            >
                                                                {addr.label}: {addr.address}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Guest Checkout Form */}
                                    {!user && (
                                        <div className="space-y-3 pt-4 border-t">
                                            <p className="font-medium text-gray-900">Guest Checkout Details</p>
                                            <Input
                                                label="Full Name"
                                                value={guestForm.name}
                                                onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                                                placeholder="John Doe"
                                                required
                                            />
                                            <Input
                                                label="Email"
                                                type="email"
                                                value={guestForm.email}
                                                onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                                                placeholder="john@example.com"
                                                required
                                            />
                                            <Input
                                                label="Phone Number"
                                                type="tel"
                                                value={guestForm.phone}
                                                onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                                                placeholder="+1 234 567 8900"
                                                required
                                            />
                                        </div>
                                    )}

                                    {/* Pickup Address */}
                                    {orderType === 'pickup' && shop && (
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm font-medium text-gray-900 mb-1">Pickup Location:</p>
                                            <p className="text-sm text-gray-600">{shop.address}</p>
                                        </div>
                                    )}

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between text-lg font-semibold">
                                            <span>Total:</span>
                                            <span className="text-emerald-600">{formatPrice(getCartTotal())}</span>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        variant="primary"
                                        className="w-full"
                                        onClick={handlePlaceOrder}
                                        isLoading={isSubmitting}
                                    >
                                        Place Order
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
