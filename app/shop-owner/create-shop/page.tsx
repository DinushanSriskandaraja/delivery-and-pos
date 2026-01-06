'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function CreateShopPage() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        latitude: '',
        longitude: ''
    })

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
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
        } catch (error) {
            console.error('Error loading user:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude.toString(),
                        longitude: position.coords.longitude.toString()
                    }))
                },
                (error) => {
                    console.error('Error getting location:', error)
                    alert('Could not get your location. Please enter coordinates manually.')
                }
            )
        } else {
            alert('Geolocation is not supported by your browser')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            // Validate coordinates
            const lat = parseFloat(formData.latitude)
            const lng = parseFloat(formData.longitude)

            if (isNaN(lat) || isNaN(lng)) {
                throw new Error('Invalid coordinates. Please use the "Get My Location" button or enter valid numbers.')
            }

            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                throw new Error('Coordinates out of range. Latitude must be between -90 and 90, longitude between -180 and 180.')
            }

            const { error: insertError } = await supabase
                .from('shops')
                .insert({
                    owner_id: user.id,
                    name: formData.name,
                    description: formData.description,
                    address: formData.address,
                    latitude: lat,
                    longitude: lng,
                    is_active: true,
                    is_approved: false
                })

            if (insertError) throw insertError

            // Redirect to dashboard
            router.push('/shop-owner?success=true')
        } catch (err: any) {
            console.error('Error creating shop:', err)
            setError(err.message || 'Failed to create shop')
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Create Your Shop</h1>
                    <p className="text-gray-600 mt-2">Fill in the details to register your shop</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Shop Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <Input
                                label="Shop Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Fresh Mart"
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe your shop..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                                    rows={3}
                                />
                            </div>

                            <Input
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Full shop address"
                                required
                            />

                            <div className="border-t pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-700">Location Coordinates</h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGetLocation}
                                    >
                                        📍 Get My Location
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Latitude"
                                        name="latitude"
                                        type="number"
                                        step="any"
                                        value={formData.latitude}
                                        onChange={handleChange}
                                        placeholder="e.g., 6.9271"
                                        required
                                    />
                                    <Input
                                        label="Longitude"
                                        name="longitude"
                                        type="number"
                                        step="any"
                                        value={formData.longitude}
                                        onChange={handleChange}
                                        placeholder="e.g., 79.8612"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Click "Get My Location" to automatically fill coordinates, or enter them manually.
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                                <p className="font-medium mb-1">📋 Note:</p>
                                <p>Your shop will be submitted for admin approval. You'll be notified once it's approved and can start adding products.</p>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1"
                                    isLoading={isSubmitting}
                                >
                                    Create Shop
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/shop-owner')}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
