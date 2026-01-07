'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ShopOwnerSettingsPage() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [shop, setShop] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        latitude: '',
        longitude: '',
        deliveryRange: '5',
        isActive: true
    })

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

            if (shopData) {
                setShop(shopData)
                setFormData({
                    name: shopData.name,
                    description: shopData.description || '',
                    address: shopData.address,
                    latitude: shopData.latitude.toString(),
                    longitude: shopData.longitude.toString(),
                    deliveryRange: (shopData.delivery_range_km || 5).toString(),
                    isActive: shopData.is_active
                })
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await fetch('/api/shop-owner/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    address: formData.address,
                    latitude: parseFloat(formData.latitude),
                    longitude: parseFloat(formData.longitude),
                    deliveryRange: parseFloat(formData.deliveryRange),
                    isActive: formData.isActive
                })
            })

            if (!response.ok) throw new Error('Failed to update settings')

            alert('Settings updated successfully!')
            await loadData()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser')
            return
        }

        setIsUpdatingLocation(true)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude.toString()
                const lng = position.coords.longitude.toString()

                setFormData(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng
                }))

                // Auto-save location immediately
                try {
                    const response = await fetch('/api/shop-owner/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...formData,
                            latitude: parseFloat(lat),
                            longitude: parseFloat(lng)
                        })
                    })

                    if (!response.ok) throw new Error('Failed to update location')
                    alert('Location updated and saved successfully!')
                } catch (error) {
                    console.error('Error saving location:', error)
                    alert('Location fetched but failed to save automatically. Please click "Save Changes".')
                } finally {
                    setIsUpdatingLocation(false)
                }
            },
            (error) => {
                console.error('Error getting location:', error)
                alert('Error getting location. Please enable location services.')
                setIsUpdatingLocation(false)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        )
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

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Shop Settings</h1>
                        <p className="text-gray-600 mt-2">Manage your shop profile and preferences</p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        isLoading={isSaving}
                    >
                        Save All Changes
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* Basic Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Visible to customers in the app</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Input
                                    label="Shop Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        rows={3}
                                    />
                                </div>

                                <Input
                                    label="Address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location & Delivery Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Location & Delivery</CardTitle>
                            <CardDescription>Set your shop's position and delivery radius</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="font-medium text-emerald-900">Live Location</h3>
                                            <p className="text-sm text-emerald-700">Update your precise GPS coordinates</p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleGetCurrentLocation}
                                            isLoading={isUpdatingLocation}
                                            className="bg-white"
                                        >
                                            📍 Update from GPS
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Latitude"
                                            type="number"
                                            step="any"
                                            value={formData.latitude}
                                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="Longitude"
                                            type="number"
                                            step="any"
                                            value={formData.longitude}
                                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Input
                                        label="Delivery Radius (km)"
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={formData.deliveryRange}
                                        onChange={(e) => setFormData({ ...formData, deliveryRange: e.target.value })}
                                        required
                                        helperText="Consumers outside this range will not see your shop in search results."
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shop Status Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Shop Status</CardTitle>
                            <CardDescription>Control your shop's visibility</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900">Accepting Orders</h3>
                                    <p className="text-sm text-gray-500">
                                        {formData.isActive
                                            ? "Your shop is currently visible to customers."
                                            : "Your shop is hidden. Turn this on to start receiving orders."}
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
