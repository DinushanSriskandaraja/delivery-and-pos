import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import ProductForm from '@/components/products/ProductForm'
import { createGlobalProduct } from '../actions'
import { testStorageBucket } from '../test-storage'

export default async function NewProductPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        redirect('/auth/login')
    }

    // Test storage bucket
    const storageTest = await testStorageBucket()
    console.log('Storage test results:', storageTest)

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={userData} />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
                    <p className="text-gray-600 mt-2">Create a new global product for the catalog</p>
                </div>

                {/* Storage Diagnostic Info */}
                {!storageTest.found && (
                    <Card className="mb-6 border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold text-red-900 mb-2">⚠️ Storage Bucket Not Found</h3>
                            <p className="text-sm text-red-700 mb-3">
                                The 'product-images' bucket doesn't exist. Available buckets:
                            </p>
                            <ul className="text-sm text-red-700 list-disc list-inside">
                                {storageTest.allBuckets && storageTest.allBuckets.length > 0 ? (
                                    storageTest.allBuckets.map((bucket: any) => (
                                        <li key={bucket.id}>
                                            {bucket.id} ({bucket.public ? 'Public' : 'Private'})
                                        </li>
                                    ))
                                ) : (
                                    <li>No buckets found</li>
                                )}
                            </ul>
                            <p className="text-sm text-red-700 mt-3">
                                Please create a bucket named exactly: <code className="bg-red-100 px-1 rounded">product-images</code>
                            </p>
                        </CardContent>
                    </Card>
                )}

                {storageTest.found && (
                    <Card className="mb-6 border-green-200 bg-green-50">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold text-green-900">✅ Storage Bucket Ready</h3>
                            <p className="text-sm text-green-700">
                                Bucket: {storageTest.productImagesBucket?.id}
                                ({storageTest.productImagesBucket?.public ? 'Public' : 'Private'})
                            </p>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                        <CardDescription>Fill in the information below to add a new product</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProductForm onSubmit={createGlobalProduct} />
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
