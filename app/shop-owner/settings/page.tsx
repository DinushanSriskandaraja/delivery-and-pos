'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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

        setIsLoading(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toString(),
                    longitude: position.coords.longitude.toString()
                }))
                setIsLoading(false)
            },
            (error) => {
                console.error('Error getting location:', error)
                alert('Error getting location. Please enable location services.')
                setIsLoading(false)
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

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Shop Settings</h1>
                    <p className="text-gray-600 mt-2">Update your shop information</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Shop Information</CardTitle>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                                    rows={3}
                                />
                            </div>

                            <Input
                                label="Address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                required
                            />

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

                            <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGetCurrentLocation}
                                    className="w-full mb-4"
                                >
                                    📍 Get Current Location
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Delivery Radius (km)"
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    value={formData.deliveryRange}
                                    onChange={(e) => setFormData({ ...formData, deliveryRange: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="rounded"
                                />
                                <label htmlFor="isActive" className="text-sm text-gray-700">
                                    Shop is active and accepting orders
                                </label>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleSave}
                                isLoading={isSaving}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
