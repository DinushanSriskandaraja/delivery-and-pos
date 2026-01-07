'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Badge from '@/components/ui/Badge'
import { calculateDistance } from '@/lib/utils'
import Link from 'next/link'
import ShopCard, { Shop } from '@/components/shops/ShopCard'



export default function ConsumerDashboard() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [shops, setShops] = useState<Shop[]>([])
    const [filteredShops, setFilteredShops] = useState<Shop[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name'>('distance')

    // Track Order Modal State
    const [showTrackModal, setShowTrackModal] = useState(false)
    const [trackOrderId, setTrackOrderId] = useState('')
    const [lastOrderId, setLastOrderId] = useState<string | null>(null)

    const handleTrackOrder = () => {
        if (!trackOrderId.trim()) return
        router.push(`/consumer/orders?orderId=${trackOrderId.trim()}`)
    }

    useEffect(() => {
        loadUserAndShops()
        getUserLocation()
        const savedOrderId = localStorage.getItem('guest_last_order_id')
        if (savedOrderId) {
            setLastOrderId(savedOrderId)
        }
    }, [])

    useEffect(() => {
        filterAndSortShops()
    }, [shops, userLocation, searchQuery, sortBy])

    const loadUserAndShops = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                if (userData && userData.role !== 'consumer') {
                    router.push(`/${userData.role.replace('_', '-')}`)
                    return
                }
                setUser(userData)
            }

            const { data: shopsData } = await supabase
                .from('shops')
                .select('*')

            if (shopsData) {
                const shopsWithRatings = await Promise.all(
                    shopsData.map(async (shop) => {
                        const { data: reviews } = await supabase
                            .from('shop_reviews')
                            .select('rating')
                            .eq('shop_id', shop.id)

                        const rating = reviews && reviews.length > 0
                            ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
                            : 0

                        return {
                            ...shop,
                            rating: Math.round(rating * 10) / 10,
                            review_count: reviews?.length || 0
                        }
                    })
                )
                console.log('Processed shops data:', shopsWithRatings)
                setShops(shopsWithRatings)
            } else {
                console.log('No shops data returned from Supabase')
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    })
                },
                (error) => {
                    console.error('Error getting location:', error)
                    setUserLocation({ lat: 6.9271, lng: 79.8612 })
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            )
        } else {
            setUserLocation({ lat: 6.9271, lng: 79.8612 })
        }
    }

    const filterAndSortShops = () => {
        if (!userLocation) return

        let filtered = shops.map(shop => ({
            ...shop,
            distance: calculateDistance(
                userLocation.lat,
                userLocation.lng,
                Number(shop.latitude),
                Number(shop.longitude)
            )
        }))

        filtered = filtered.filter(shop => {
            const distance = shop.distance || 0
            const deliveryRange = shop.delivery_range_km

            // If delivery range is 0, show shop if within 5km (for pickup)
            // Otherwise check if within delivery range
            if (deliveryRange === 0) {
                return distance <= 5
            }

            return distance <= (deliveryRange || 5)
        })

        if (searchQuery) {
            filtered = filtered.filter(shop =>
                shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                shop.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'distance':
                    return (a.distance || 0) - (b.distance || 0)
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0)
                case 'name':
                    return a.name.localeCompare(b.name)
                default:
                    return 0
            }
        })

        setFilteredShops(filtered)
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

            <div className="bg-emerald-900 text-emerald-50 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-800 rounded-full opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-emerald-950 rounded-full opacity-50 blur-3xl"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                        Discover Local Flavors
                    </h1>
                    <p className="text-lg md:text-xl text-emerald-100 max-w-2xl">
                        Find the best grocery shops near you, delivering fresh produce and essentials directly to your doorstep.
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-12">
                {/* Search & Filter Bar */}
                <Card className="mb-10 shadow-lg border-0 ring-1 ring-black/5">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 w-full md:w-auto relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400">🔍</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search shops or items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ease-in-out sm:text-sm"
                                />
                            </div>

                            <div className="flex gap-4 w-full md:w-auto">
                                <div className="relative min-w-[140px]">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="block w-full pl-3 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm appearance-none cursor-pointer"
                                    >
                                        <option value="distance">Nearest First</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="name">Alphabetical</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                        ▼
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={getUserLocation}
                                    className="whitespace-nowrap py-3 px-6 rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700"
                                >
                                    📍 Update Location
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="mb-6 flex items-center justify-between text-sm">
                    <p className="text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                        📍 Found <span className="font-semibold text-gray-900">{filteredShops.length}</span> shops nearby
                    </p>
                </div>

                {filteredShops.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="text-6xl mb-4 opacity-50">🏪</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No shops found nearby</h3>
                        <p className="text-gray-500">We couldn't find any shops delivering to your current location.</p>
                        <Button variant="outline" className="mt-6" onClick={getUserLocation}>
                            Try Updating Location
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {filteredShops.map((shop) => (
                            <ShopCard key={shop.id} shop={shop} />
                        ))}
                    </div>
                )}

                {/* Footer Quick Actions */}
                <div className="mt-20 border-t border-gray-200 pt-10">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 px-1">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {user ? (
                            <>
                                <Link href="/consumer/orders" className="block">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all text-center group">
                                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">📦</div>
                                        <span className="font-medium text-gray-700 group-hover:text-emerald-700">Orders</span>
                                    </div>
                                </Link>
                                <Link href="/consumer/profile" className="block">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all text-center group">
                                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">👤</div>
                                        <span className="font-medium text-gray-700 group-hover:text-emerald-700">Profile</span>
                                    </div>
                                </Link>
                            </>
                        ) : (
                            <>
                                <div onClick={() => setShowTrackModal(true)} className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all text-center cursor-pointer group">
                                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">🔍</div>
                                    <span className="font-medium text-gray-700 group-hover:text-blue-600">Track Order</span>
                                </div>
                                <Link href="/auth/login" className="block">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all text-center group">
                                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">🔑</div>
                                        <span className="font-medium text-gray-700 group-hover:text-emerald-600">Login</span>
                                    </div>
                                </Link>
                            </>
                        )}
                        <Link href="/consumer/cart" className="block">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all text-center group">
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">🛒</div>
                                <span className="font-medium text-gray-700 group-hover:text-emerald-700">Cart</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Track Order Modal */}
            {
                showTrackModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                        <Card className="max-w-md w-full shadow-2xl border-0">
                            <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
                                <CardTitle className="text-xl">Track Guest Order</CardTitle>
                                <CardDescription>Enter the Order ID you received at check out.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <Input
                                        label="Order ID"
                                        placeholder="e.g. 123e4567-e89b..."
                                        value={trackOrderId}
                                        onChange={(e) => setTrackOrderId(e.target.value)}
                                        className="text-lg font-mono placeholder:font-sans"
                                    />
                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowTrackModal(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="flex-1"
                                            onClick={handleTrackOrder}
                                            disabled={!trackOrderId.trim()}
                                        >
                                            Track Order
                                        </Button>
                                    </div>
                                    {lastOrderId && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                                            <p className="text-xs text-gray-500 mb-2">Recent Order</p>
                                            <Link href={`/consumer/orders?orderId=${lastOrderId}`}>
                                                <span className="text-emerald-600 hover:underline text-sm font-medium">
                                                    View {lastOrderId.slice(0, 8)}...
                                                </span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </div>
    )
}
