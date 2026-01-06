'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDateTime } from '@/lib/utils'

export default function AdminUsersPage() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

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

            // Get all users
            const { data: usersData } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (usersData) {
                setUsers(usersData)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
        setUpdatingUserId(userId)
        try {
            const response = await fetch('/api/admin/toggle-user-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, isActive: !currentStatus })
            })

            if (!response.ok) throw new Error('Failed to update user status')

            // Reload data
            await loadData()
        } catch (error: any) {
            console.error('Error toggling user status:', error)
            alert(error.message || 'Failed to update user status')
        } finally {
            setUpdatingUserId(null)
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

    // Calculate stats
    const roleStats = {
        admin: users.filter(u => u.role === 'admin').length,
        shop_owner: users.filter(u => u.role === 'shop_owner').length,
        consumer: users.filter(u => u.role === 'consumer').length,
        delivery_partner: users.filter(u => u.role === 'delivery_partner').length,
    }

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'admin': return 'danger'
            case 'shop_owner': return 'info'
            case 'consumer': return 'success'
            case 'delivery_partner': return 'warning'
            default: return 'default'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-2">Manage all users across the platform</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Admins</p>
                                <p className="text-3xl font-bold text-red-600 mt-2">{roleStats.admin}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Shop Owners</p>
                                <p className="text-3xl font-bold text-blue-600 mt-2">{roleStats.shop_owner}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Consumers</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{roleStats.consumer}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Delivery Partners</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-2">{roleStats.delivery_partner}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Users List */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>{users.length} total users</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {users.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Phone</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Role</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Joined</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u: any) => (
                                            <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <p className="font-medium text-gray-900">{u.full_name}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="text-sm text-gray-600">{u.email}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="text-sm text-gray-600">{u.phone}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={getRoleBadgeVariant(u.role)}>
                                                        {u.role.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={u.is_active !== false ? 'success' : 'danger'}>
                                                        {u.is_active !== false ? 'Active' : 'Suspended'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="text-sm text-gray-600">
                                                        {formatDateTime(u.created_at)}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {u.id !== user.id && (
                                                        <Button
                                                            size="sm"
                                                            variant={u.is_active !== false ? 'danger' : 'primary'}
                                                            onClick={() => handleToggleUserStatus(u.id, u.is_active !== false)}
                                                            isLoading={updatingUserId === u.id}
                                                        >
                                                            {u.is_active !== false ? 'Suspend' : 'Activate'}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">👥</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No users yet</h3>
                                <p className="text-gray-600">Users will appear here as they register</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
