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

        const { price, stockQuantity, isAvailable } = await request.json()

        // Update product
        const { error } = await supabase
            .from('shop_products')
            .update({
                price,
                stock_quantity: stockQuantity,
                is_available: isAvailable
            })
            .eq('id', params.id)
            .eq('shop_id', shop.id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error updating product:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
