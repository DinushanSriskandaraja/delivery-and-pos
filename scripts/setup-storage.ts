import { createClient } from '@supabase/supabase-js'

// This script creates the storage bucket for product images
// Run with: npx tsx scripts/setup-storage.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!')
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function setupStorage() {
    console.log('🚀 Setting up storage bucket...\n')

    // Create the bucket
    console.log('1. Creating product-images bucket...')
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('product-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    })

    if (bucketError) {
        if (bucketError.message.includes('already exists')) {
            console.log('✅ Bucket already exists, skipping creation')
        } else {
            console.error('❌ Error creating bucket:', bucketError)
            process.exit(1)
        }
    } else {
        console.log('✅ Bucket created successfully!')
    }

    console.log('\n2. Verifying bucket...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
        console.error('❌ Error listing buckets:', listError)
        process.exit(1)
    }

    const productImagesBucket = buckets?.find(b => b.id === 'product-images')
    if (productImagesBucket) {
        console.log('✅ Bucket verified!')
        console.log('   - Name:', productImagesBucket.name)
        console.log('   - Public:', productImagesBucket.public)
    } else {
        console.error('❌ Bucket not found after creation')
        process.exit(1)
    }

    console.log('\n✨ Storage setup complete!')
    console.log('\nYou can now upload product images through the admin panel.')
}

setupStorage().catch(console.error)
