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

interface Shop {
    id: string
    name: string
    description: string
    address: string
    latitude: number
    longitude: number
    delivery_range_km: number
    distance?: number
    rating?: number
    review_count?: number
}

export default function ConsumerDashboard() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [shops, setShops] = useState<Shop[]>([])
    const [filteredShops, setFilteredShops] = useState<Shop[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [searchRadius, setSearchRadius] = useState(5000) // Default to 5000km for debugging
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name'>('distance')

    // Track Order Modal State
    const [showTrackModal, setShowTrackModal] = useState(false)
    const [trackOrderId, setTrackOrderId] = useState('')
    const [lastOrderId, setLastOrderId] = useState<string | null>(null) // State for last order

    const handleTrackOrder = () => {
        if (!trackOrderId.trim()) return
        router.push(`/consumer/orders?orderId=${trackOrderId.trim()}`)
    }

    useEffect(() => {
        loadUserAndShops()
        getUserLocation()
        // Check for last guest order
        const savedOrderId = localStorage.getItem('guest_last_order_id')
        if (savedOrderId) {
            setLastOrderId(savedOrderId)
        }
    }, [])

    useEffect(() => {
        filterAndSortShops()
    }, [shops, userLocation, searchRadius, searchQuery, sortBy])

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
                    // Start: Redirect non-consumers to their dashboard or show error
                    router.push(`/${userData.role.replace('_', '-')}`)
                    return
                }
                setUser(userData)
            }
            // If no user, stay as guest (user is null)

            // Load shops
            const { data: shopsData } = await supabase
                .from('shops')
                .select('*')
            // .eq('is_active', true) // Removed for debugging
            // .eq('is_approved', true) // Removed for debugging

            if (shopsData) {
                // Load ratings for each shop
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
                    // Default to Colombo, Sri Lanka
                    setUserLocation({ lat: 6.9271, lng: 79.8612 })
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            )
        } else {
            // Default to Colombo, Sri Lanka
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

        // Filter by radius AND shop's delivery range
        filtered = filtered.filter(shop => {
            const distance = shop.distance || 0
            const deliveryRange = shop.delivery_range_km || 5 // Default to 5km if not set

            // Check if within user's search radius AND within shop's delivery range
            return distance <= searchRadius && distance <= deliveryRange
        })

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(shop =>
                shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                shop.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Sort
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Discover Nearby Shops</h1>
                    <p className="text-gray-600 mt-2">Find grocery shops near you and start shopping</p>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input
                                label="Search Shops"
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search Radius (km)
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={searchRadius}
                                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                                    className="w-full"
                                />
                                <p className="text-sm text-gray-600 mt-1">{searchRadius} km</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sort By
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="distance">Distance</option>
                                    <option value="rating">Rating</option>
                                    <option value="name">Name</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={getUserLocation}
                                >
                                    📍 Update Location
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Shop Results */}
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-gray-600">
                        Found {filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''} within {searchRadius}km
                    </p>
                </div>

                {filteredShops.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="text-6xl mb-4">🏪</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No shops found</h3>
                            <p className="text-gray-600">Try increasing your search radius or changing your location</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredShops.map((shop) => (
                            <Link key={shop.id} href={`/consumer/shops/${shop.id}`}>
                                <Card hoverable>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle>{shop.name}</CardTitle>
                                                <CardDescription className="mt-2">{shop.description}</CardDescription>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <span className="mr-2">📍</span>
                                                <span>{shop.distance?.toFixed(1)} km away</span>
                                            </div>

                                            {shop.rating && shop.rating > 0 ? (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <span className="mr-2">⭐</span>
                                                    <span>{shop.rating.toFixed(1)} ({shop.review_count} reviews)</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <span className="mr-2">⭐</span>
                                                    <span>No reviews yet</span>
                                                </div>
                                            )}

                                            <div className="flex items-center text-sm text-gray-600">
                                                <span className="mr-2">📍</span>
                                                <span className="truncate">{shop.address}</span>
                                            </div>

                                            <div className="flex items-center text-sm text-emerald-600 font-medium">
                                                <span className="mr-2">🚚</span>
                                                <span>Delivers within {shop.delivery_range_km ?? 5} km</span>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        <Button variant="primary" className="w-full">
                                            Browse Products →
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Quick Actions */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {user ? (
                        <Link href="/consumer/orders">
                            <Card hoverable className="h-full">
                                <CardContent className="pt-6 text-center">
                                    <div className="text-5xl mb-3">📦</div>
                                    <h3 className="font-semibold text-gray-900">My Orders</h3>
                                    <p className="text-sm text-gray-600 mt-1">View order history</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ) : (

                        <div className="h-full flex flex-col gap-2">
                            <div onClick={() => setShowTrackModal(true)} className="cursor-pointer flex-1">
                                <Card hoverable className="h-full bg-blue-50 border-blue-200">
                                    <CardContent className="pt-6 text-center">
                                        <div className="text-5xl mb-3">🔍</div>
                                        <h3 className="font-semibold text-gray-900">Track Order</h3>
                                        <p className="text-sm text-gray-600 mt-1">Enter Order ID to track status</p>
                                    </CardContent>
                                </Card>
                            </div>
                            {lastOrderId && (
                                <Link href={`/consumer/orders?orderId=${lastOrderId}`}>
                                    <Button variant="outline" className="w-full text-sm">
                                        ↺ View Last Order
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )
                    }

                    <Link href="/consumer/cart">
                        <Card hoverable className="h-full">
                            <CardContent className="pt-6 text-center">
                                <div className="text-5xl mb-3">🛒</div>
                                <h3 className="font-semibold text-gray-900">Shopping Cart</h3>
                                <p className="text-sm text-gray-600 mt-1">View your cart</p>
                            </CardContent>
                        </Card>
                    </Link>

                    {
                        user ? (
                            <Link href="/consumer/profile">
                                <Card hoverable className="h-full">
                                    <CardContent className="pt-6 text-center">
                                        <div className="text-5xl mb-3">👤</div>
                                        <h3 className="font-semibold text-gray-900">Profile</h3>
                                        <p className="text-sm text-gray-600 mt-1">Manage your account</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ) : (
                            <Link href="/auth/login">
                                <Card hoverable className="h-full border-emerald-200 bg-emerald-50">
                                    <CardContent className="pt-6 text-center">
                                        <div className="text-5xl mb-3">🔑</div>
                                        <h3 className="font-semibold text-gray-900">Login / Register</h3>
                                        <p className="text-sm text-gray-600 mt-1">Create an account</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    }
                </div >
            </main >

            {/* Track Order Modal */}
            {
                showTrackModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <Card className="max-w-md w-full">
                            <CardHeader>
                                <CardTitle>Track Guest Order</CardTitle>
                                <CardDescription>Enter the Order ID you received at checkout</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Input
                                        label="Order ID"
                                        placeholder="e.g. 123e4567-e89b..."
                                        value={trackOrderId}
                                        onChange={(e) => setTrackOrderId(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="primary"
                                            className="flex-1"
                                            onClick={handleTrackOrder}
                                            disabled={!trackOrderId.trim()}
                                        >
                                            Track Status
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowTrackModal(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </div >
    )
}
