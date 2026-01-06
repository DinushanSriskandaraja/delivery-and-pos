import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default async function DeliveryPartnerDashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!userData || userData.role !== 'delivery_partner') {
        redirect('/auth/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={userData} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Delivery Partner Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage your deliveries</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Welcome, {userData.full_name}!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🚚</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Partner Dashboard</h2>
                            <p className="text-gray-600">Delivery features coming soon!</p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
