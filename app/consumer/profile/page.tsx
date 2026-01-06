'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Address {
    id: string
    label: string
    address: string
    latitude: number
    longitude: number
    is_default: boolean
}

export default function ProfilePage() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [addresses, setAddresses] = useState<Address[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // New address form
    const [showAddressForm, setShowAddressForm] = useState(false)
    const [newAddress, setNewAddress] = useState({
        label: '',
        address: '',
        is_default: false
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

            setUser(userData)
            setFullName(userData.full_name)
            setPhone(userData.phone)

            // Load addresses
            const { data: addressesData } = await supabase
                .from('consumer_addresses')
                .select('*')
                .eq('consumer_id', authUser.id)
                .order('is_default', { ascending: false })

            if (addressesData) {
                setAddresses(addressesData)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveProfile = async () => {
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: fullName,
                    phone: phone
                })
                .eq('id', user.id)

            if (error) throw error

            setIsEditing(false)
            loadData()
        } catch (error: any) {
            console.error('Error saving profile:', error)
            alert(error.message || 'Failed to save profile')
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddAddress = async () => {
        try {
            // If this is set as default, unset other defaults
            if (newAddress.is_default) {
                await supabase
                    .from('consumer_addresses')
                    .update({ is_default: false })
                    .eq('consumer_id', user.id)
            }

            const { error } = await supabase
                .from('consumer_addresses')
                .insert({
                    consumer_id: user.id,
                    label: newAddress.label,
                    address: newAddress.address,
                    latitude: 0, // You would get this from geocoding
                    longitude: 0,
                    is_default: newAddress.is_default
                })

            if (error) throw error

            setShowAddressForm(false)
            setNewAddress({ label: '', address: '', is_default: false })
            loadData()
        } catch (error: any) {
            console.error('Error adding address:', error)
            alert(error.message || 'Failed to add address')
        }
    }

    const handleDeleteAddress = async (id: string) => {
        if (!confirm('Are you sure you want to delete this address?')) return

        try {
            const { error } = await supabase
                .from('consumer_addresses')
                .delete()
                .eq('id', id)

            if (error) throw error

            loadData()
        } catch (error: any) {
            console.error('Error deleting address:', error)
            alert(error.message || 'Failed to delete address')
        }
    }

    const handleSetDefaultAddress = async (id: string) => {
        try {
            // Unset all defaults
            await supabase
                .from('consumer_addresses')
                .update({ is_default: false })
                .eq('consumer_id', user.id)

            // Set new default
            const { error } = await supabase
                .from('consumer_addresses')
                .update({ is_default: true })
                .eq('id', id)

            if (error) throw error

            loadData()
        } catch (error: any) {
            console.error('Error setting default address:', error)
            alert(error.message || 'Failed to set default address')
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

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

                <div className="space-y-6">
                    {/* Profile Information */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Profile Information</CardTitle>
                                {!isEditing && (
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                        Edit
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <Input
                                        label="Full Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                    <Input
                                        label="Phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                    <Input
                                        label="Email"
                                        value={user.email}
                                        disabled
                                        helperText="Email cannot be changed"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="primary"
                                            onClick={handleSaveProfile}
                                            isLoading={isSaving}
                                        >
                                            Save Changes
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsEditing(false)
                                                setFullName(user.full_name)
                                                setPhone(user.phone)
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Full Name</p>
                                        <p className="font-medium">{user.full_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="font-medium">{user.phone}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Saved Addresses */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Saved Addresses</CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAddressForm(!showAddressForm)}
                                >
                                    {showAddressForm ? 'Cancel' : '+ Add Address'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {showAddressForm && (
                                <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                                    <Input
                                        label="Label"
                                        placeholder="e.g., Home, Office"
                                        value={newAddress.label}
                                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                    />
                                    <Input
                                        label="Address"
                                        placeholder="Enter full address"
                                        value={newAddress.address}
                                        onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_default"
                                            checked={newAddress.is_default}
                                            onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                                            className="rounded"
                                        />
                                        <label htmlFor="is_default" className="text-sm text-gray-700">
                                            Set as default address
                                        </label>
                                    </div>
                                    <Button variant="primary" size="sm" onClick={handleAddAddress}>
                                        Save Address
                                    </Button>
                                </div>
                            )}

                            {addresses.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No saved addresses</p>
                            ) : (
                                <div className="space-y-3">
                                    {addresses.map((address) => (
                                        <div
                                            key={address.id}
                                            className={`p-4 rounded-lg border-2 ${address.is_default ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{address.label}</p>
                                                        {address.is_default && (
                                                            <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{address.address}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {!address.is_default && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleSetDefaultAddress(address.id)}
                                                        >
                                                            Set Default
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteAddress(address.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
