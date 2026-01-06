import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // Verify admin user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!userData || userData.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get request body
        const { shopId, action } = await request.json()

        let updateData: any = {}

        switch (action) {
            case 'approve':
                updateData = { is_approved: true }
                break
            case 'reject':
                updateData = { is_approved: false, is_active: false }
                break
            case 'activate':
                updateData = { is_active: true }
                break
            case 'deactivate':
                updateData = { is_active: false }
                break
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        // Update shop
        const { error } = await supabase
            .from('shops')
            .update(updateData)
            .eq('id', shopId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error updating shop:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
