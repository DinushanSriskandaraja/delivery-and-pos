'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { calculateDistance } from '@/lib/utils'
import ShopCard, { Shop } from '@/components/shops/ShopCard'



export default function Home() {
  const supabase = createClient()
  const [nearbyShops, setNearbyShops] = useState<Shop[]>([])
  const [isLoadingShops, setIsLoadingShops] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    getUserLocation()
  }, [])

  useEffect(() => {
    if (userLocation) {
      loadNearbyShops()
    } else {
      setIsLoadingShops(false)
    }
  }, [userLocation])

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
          setIsLoadingShops(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } else {
      setIsLoadingShops(false)
    }
  }

  const loadNearbyShops = async () => {
    try {
      const { data: shopsData } = await supabase
        .from('shops')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true)

      if (shopsData && userLocation) {
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

        // Calculate distances and filter
        const withDistance = shopsWithRatings.map(shop => ({
          ...shop,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            Number(shop.latitude),
            Number(shop.longitude)
          )
        }))

        // Filter shops within typical range (e.g. 20km) and sort by distance
        const nearby = withDistance
          .filter(shop => (shop.distance || 0) <= 20)
          .sort((a, b) => (a.distance || 0) - (b.distance || 0))
          .slice(0, 3)

        setNearbyShops(nearby)
      }
    } catch (error) {
      console.error('Error loading nearby shops:', error)
    } finally {
      setIsLoadingShops(false)
    }
  }

  const features = [
    {
      title: "For Consumers",
      description: "Discover nearby grocery shops, browse products, and order for delivery or pickup",
      icon: "🛒",
      link: "/auth/register",
    },
    {
      title: "For Shop Owners",
      description: "Manage inventory, process orders, and use integrated POS system for walk-in customers",
      icon: "🏪",
      link: "/auth/register",
    },
    {
      title: "For Delivery Partners",
      description: "Accept delivery requests, navigate to locations, and earn by delivering orders",
      icon: "🚚",
      link: "/auth/register",
    },
    {
      title: "Location-Based Discovery",
      description: "Find shops within your area with distance-limited search and real-time availability",
      icon: "📍",
      link: "/consumer",
    },
    {
      title: "Integrated POS System",
      description: "Process in-store sales, generate invoices, and track inventory in real-time",
      icon: "💳",
      link: "/shop-owner/pos",
    },
    {
      title: "Comprehensive Analytics",
      description: "Track sales, revenue, and inventory with detailed reports and insights",
      icon: "📊",
      link: "/shop-owner/reports",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl mb-8 shadow-xl">
              <span className="text-white font-bold text-4xl">G</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-emerald-600">GroceryShop</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A unified, location-based grocery marketplace and POS platform connecting consumers, shop owners, and delivery partners
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/consumer">
                <Button variant="primary" size="lg">
                  Start Shopping
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Shops Section */}
      {(userLocation || isLoadingShops) && (
        <section className="py-12 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Shops Near You</h2>
                <p className="text-gray-600 mt-1">Found based on your location</p>
              </div>
              <Link href="/consumer">
                <Button variant="outline">View All Shops →</Button>
              </Link>
            </div>

            {isLoadingShops ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : nearbyShops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {nearbyShops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">No shops found nearby. Try expanding your search in the full view.</p>
                <Link href="/consumer">
                  <Button variant="primary">Browse All Shops</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600">
              Powerful features for every role in the grocery ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} hoverable>
                <CardHeader>
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={feature.link}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Learn More →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Grocery Business?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands of shops, consumers, and delivery partners already using GroceryShop
          </p>
          <Link href="/auth/register">
            <Button variant="secondary" size="lg">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">GroceryShop</h3>
              <p className="text-gray-400 text-sm">
                Your unified grocery marketplace and POS platform
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-gray-300">For Consumers</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/consumer" className="hover:text-white">Browse Shops</Link></li>
                <li><Link href="/consumer/orders" className="hover:text-white">Track Orders</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-gray-300">For Shop Owners</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/shop-owner" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/shop-owner/pos" className="hover:text-white">POS System</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-gray-300">For Delivery Partners</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/delivery" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/delivery/orders" className="hover:text-white">My Deliveries</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} GroceryShop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
