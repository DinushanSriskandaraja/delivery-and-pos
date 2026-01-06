'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function AdminShopsPage() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [shops, setShops] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [updatingShopId, setUpdatingShopId] = useState<string | null>(null)

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

            if (!userData || userData.role !== 'admin') {
                router.push('/auth/login')
                return
            }

            setUser(userData)

            // Get all shops
            const { data: shopsData } = await supabase
                .from('shops')
                .select('*, users(full_name, email)')
                .order('created_at', { ascending: false })

            if (shopsData) {
                setShops(shopsData)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleShopAction = async (shopId: string, action: string) => {
        setUpdatingShopId(shopId)
        try {
            const response = await fetch('/api/admin/update-shop-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shopId, action })
            })

            if (!response.ok) throw new Error('Failed to update shop')

            // Reload data
            await loadData()
        } catch (error: any) {
            console.error('Error updating shop:', error)
            alert(error.message || 'Failed to update shop')
        } finally {
            setUpdatingShopId(null)
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

    const pendingCount = shops.filter(s => !s.is_approved).length

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Shop Management</h1>
                    <p className="text-gray-600 mt-2">Manage and approve shops on the platform</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Total Shops</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{shops.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Pending Approval</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Active Shops</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {shops.filter(s => s.is_active && s.is_approved).length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Shops List */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Shops</CardTitle>
                        <CardDescription>Manage shop approvals and status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {shops.length > 0 ? (
                            <div className="space-y-4">
                                {shops.map((shop: any) => (
                                    <div key={shop.id} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                                                    <Badge variant={shop.is_approved ? 'success' : 'warning'}>
                                                        {shop.is_approved ? 'Approved' : 'Pending'}
                                                    </Badge>
                                                    <Badge variant={shop.is_active ? 'success' : 'danger'}>
                                                        {shop.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{shop.description}</p>
                                                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Owner:</span>
                                                        <span className="ml-2 text-gray-900">{shop.users?.full_name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Email:</span>
                                                        <span className="ml-2 text-gray-900">{shop.users?.email}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-gray-500">Address:</span>
                                                        <span className="ml-2 text-gray-900">{shop.address}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                {!shop.is_approved && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => handleShopAction(shop.id, 'approve')}
                                                            isLoading={updatingShopId === shop.id}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => handleShopAction(shop.id, 'reject')}
                                                            isLoading={updatingShopId === shop.id}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {shop.is_approved && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleShopAction(shop.id, shop.is_active ? 'deactivate' : 'activate')}
                                                        isLoading={updatingShopId === shop.id}
                                                    >
                                                        {shop.is_active ? 'Deactivate' : 'Activate'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🏪</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No shops yet</h3>
                                <p className="text-gray-600">Shops will appear here once shop owners register</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
