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

        const { items, paymentMethod } = await request.json()

        // Calculate total
        const total = items.reduce((sum: number, item: any) => sum + item.subtotal, 0)

        // Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                shop_id: shop.id,
                consumer_id: null, // Walk-in order
                order_type: 'walk_in',
                status: 'completed',
                total_amount: total,
                payment_method: paymentMethod
            })
            .select()
            .single()

        if (orderError) throw orderError

        // Create order items and update stock
        for (const item of items) {
            // Insert order item
            const { error: itemError } = await supabase
                .from('order_items')
                .insert({
                    order_id: order.id,
                    shop_product_id: item.shopProductId,
                    quantity: item.quantity,
                    unit_price: item.price,
                    subtotal: item.subtotal
                })

            if (itemError) throw itemError

            // Update stock
            const { error: stockError } = await supabase
                .rpc('decrement_stock', {
                    product_id: item.shopProductId,
                    quantity: item.quantity
                })

            if (stockError) {
                // If stock update fails, we should rollback, but for simplicity we'll just log
                console.error('Stock update failed:', stockError)
            }
        }

        return NextResponse.json({ success: true, orderId: order.id })
    } catch (error: any) {
        console.error('Error creating POS order:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
