'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function uploadProductImage(formData: FormData) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify user is admin
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        return { error: 'Unauthorized - Admin access required' }
    }

    const file = formData.get('image') as File
    if (!file || file.size === 0) {
        return { error: 'No file provided' }
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
        return { error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.' }
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
        return { error: 'File size too large. Maximum size is 5MB.' }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `products/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (uploadError) {
        console.error('Upload error:', uploadError)
        return { error: 'Failed to upload image' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

    return { success: true, url: publicUrl }
}

export async function createGlobalProduct(formData: FormData) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify user is admin
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        return { error: 'Unauthorized - Admin access required' }
    }

    // Extract form data
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const base_unit = formData.get('base_unit') as string
    const imageFile = formData.get('image') as File

    // Validate required fields
    if (!name || !category || !base_unit) {
        return { error: 'Name, category, and base unit are required' }
    }

    let image_url = null

    // Handle image upload if provided
    if (imageFile && imageFile.size > 0) {
        const uploadFormData = new FormData()
        uploadFormData.append('image', imageFile)

        const uploadResult = await uploadProductImage(uploadFormData)

        if (uploadResult.error) {
            return { error: uploadResult.error }
        }

        image_url = uploadResult.url
    }

    // Insert product
    const { data, error } = await supabase
        .from('global_products')
        .insert({
            name,
            description,
            category,
            base_unit,
            image_url,
            created_by: user.id,
            is_approved: true // Auto-approve products created by admin
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating product:', error)
        return { error: 'Failed to create product' }
    }

    revalidatePath('/admin/products')
    redirect('/admin/products')
}

export async function updateGlobalProduct(productId: string, formData: FormData) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify user is admin
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        return { error: 'Unauthorized - Admin access required' }
    }

    // Extract form data
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const base_unit = formData.get('base_unit') as string
    const image_url = formData.get('image_url') as string

    // Update product
    const { error } = await supabase
        .from('global_products')
        .update({
            name,
            description,
            category,
            base_unit,
            image_url: image_url || null
        })
        .eq('id', productId)

    if (error) {
        console.error('Error updating product:', error)
        return { error: 'Failed to update product' }
    }

    revalidatePath('/admin/products')
    return { success: true }
}

export async function approveProduct(productId: string) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify user is admin
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        return { error: 'Unauthorized - Admin access required' }
    }

    // Approve product
    const { error } = await supabase
        .from('global_products')
        .update({ is_approved: true })
        .eq('id', productId)

    if (error) {
        console.error('Error approving product:', error)
        return { error: 'Failed to approve product' }
    }

    revalidatePath('/admin/products')
    return { success: true }
}

export async function approveProductRequest(requestId: string) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify user is admin
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        return { error: 'Unauthorized - Admin access required' }
    }

    // Get request details
    const { data: request, error: fetchError } = await supabase
        .from('product_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (fetchError || !request) {
        return { error: 'Product request not found' }
    }

    // Create global product
    const { error: createError } = await supabase
        .from('global_products')
        .insert({
            name: request.product_name,
            description: request.description,
            category: request.category,
            base_unit: request.base_unit || 'piece', // Default if missing
            image_url: null, // Requests might not have images initially
            created_by: user.id,
            is_approved: true
        })

    if (createError) {
        console.error('Error creating approved product:', createError)
        return { error: 'Failed to create global product' }
    }

    // Update request status
    const { error: updateError } = await supabase
        .from('product_requests')
        .update({ status: 'approved' })
        .eq('id', requestId)

    if (updateError) {
        console.error('Error updating request status:', updateError)
        return { error: 'Failed to update request status' }
    }

    revalidatePath('/admin/products')
    return { success: true }
}

export async function rejectProductRequest(requestId: string) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify user is admin
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        return { error: 'Unauthorized - Admin access required' }
    }

    // Update request status
    const { error } = await supabase
        .from('product_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)

    if (error) {
        console.error('Error rejecting request:', error)
        return { error: 'Failed to reject request' }
    }

    revalidatePath('/admin/products')
    return { success: true }
}
