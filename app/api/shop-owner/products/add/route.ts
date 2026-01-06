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

        const { globalProductId, price, stockQuantity } = await request.json()

        // Check if product already exists in shop
        const { data: existing } = await supabase
            .from('shop_products')
            .select('id')
            .eq('shop_id', shop.id)
            .eq('global_product_id', globalProductId)
            .single()

        if (existing) {
            return NextResponse.json({ error: 'Product already added to shop' }, { status: 400 })
        }

        // Add product to shop
        const { error } = await supabase
            .from('shop_products')
            .insert({
                shop_id: shop.id,
                global_product_id: globalProductId,
                price,
                stock_quantity: stockQuantity,
                is_available: true
            })

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error adding product:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
