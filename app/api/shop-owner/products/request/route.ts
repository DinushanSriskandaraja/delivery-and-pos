import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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

        const { productName, description, category, baseUnit } = await request.json()

        // Create product request
        const { error } = await supabase
            .from('product_requests')
            .insert({
                shop_id: shop.id,
                product_name: productName,
                description,
                category,
                base_unit: baseUnit,
                status: 'pending'
            })

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error creating product request:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
