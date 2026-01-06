import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!userData || userData.role !== 'shop_owner') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get shop
        const { data: shop } = await supabase
            .from('shops')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (!shop) {
            return NextResponse.json({ error: 'No shop found' }, { status: 404 })
        }

        const { deliveryPartnerId } = await request.json()

        // Validate delivery partner
        const { data: partner } = await supabase
            .from('users')
            .select('id, role')
            .eq('id', deliveryPartnerId)
            .eq('role', 'delivery_partner')
            .single()

        if (!partner) {
            return NextResponse.json({ error: 'Invalid delivery partner' }, { status: 400 })
        }

        // Assign delivery partner and update status
        const { error } = await supabase
            .from('orders')
            .update({
                assigned_delivery_partner_id: deliveryPartnerId,
                status: 'out_for_delivery'
            })
            .eq('id', params.id)
            .eq('shop_id', shop.id)
            .eq('order_type', 'delivery')

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error assigning delivery partner:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
