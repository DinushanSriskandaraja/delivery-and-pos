import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
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

        const { name, description, address, latitude, longitude, isActive, deliveryRange } = await request.json()

        // Update shop
        const { error } = await supabase
            .from('shops')
            .update({
                name,
                description,
                address,
                latitude,
                longitude,
                is_active: isActive,
                delivery_range_km: deliveryRange
            })
            .eq('owner_id', user.id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error updating shop:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
