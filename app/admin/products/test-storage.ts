'use server'

import { createClient } from '@/lib/supabase/server'

export async function testStorageBucket() {
    const supabase = await createClient()

    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
        console.error('Error listing buckets:', error)
        return { error: error.message, buckets: [] }
    }

    console.log('Available buckets:', buckets)

    const productImagesBucket = buckets?.find(b => b.id === 'product-images')

    return {
        allBuckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })),
        productImagesBucket: productImagesBucket ? {
            id: productImagesBucket.id,
            name: productImagesBucket.name,
            public: productImagesBucket.public
        } : null,
        found: !!productImagesBucket
    }
}
