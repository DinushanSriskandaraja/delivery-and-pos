'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const CATEGORIES = [
    'Fruits & Vegetables',
    'Dairy & Eggs',
    'Meat & Seafood',
    'Bakery',
    'Beverages',
    'Snacks',
    'Pantry Staples',
    'Frozen Foods',
    'Personal Care',
    'Household',
    'Other'
]

const BASE_UNITS = [
    'kg',
    'g',
    'lb',
    'oz',
    'L',
    'ml',
    'piece',
    'dozen',
    'pack',
    'bundle',
    'box'
]

interface ProductFormProps {
    onSubmit: (formData: FormData) => Promise<{ error?: string } | void>
    initialData?: {
        name?: string
        description?: string
        category?: string
        base_unit?: string
    }
    submitLabel?: string
    showImageUpload?: boolean
    onCancel?: () => void
}

export default function ProductForm({
    onSubmit,
    initialData,
    submitLabel = 'Create Product',
    showImageUpload = true,
    onCancel
}: ProductFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) {
            setImagePreview(null)
            setSelectedFile(null)
            return
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
            setError('Invalid file type. Please upload a JPG, PNG, or WebP image.')
            setImagePreview(null)
            setSelectedFile(null)
            return
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            setError('File size too large. Maximum size is 5MB.')
            setImagePreview(null)
            setSelectedFile(null)
            return
        }

        setError(null)
        setSelectedFile(file)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)

        try {
            const result = await onSubmit(formData)
            if (result?.error) {
                setError(result.error)
                setLoading(false)
            }
            // If successful, the parent handles next steps or redirect
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred')
            setLoading(false)
        }
    }

    const handleCancel = () => {
        if (onCancel) {
            onCancel()
        } else {
            router.back()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    defaultValue={initialData?.name}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Organic Bananas"
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={3}
                    defaultValue={initialData?.description}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the product"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="category"
                        name="category"
                        required
                        defaultValue={initialData?.category || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Select a category</option>
                        {CATEGORIES.map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="base_unit" className="block text-sm font-medium text-gray-700 mb-2">
                        Base Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="base_unit"
                        name="base_unit"
                        required
                        defaultValue={initialData?.base_unit || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Select a unit</option>
                        {BASE_UNITS.map(unit => (
                            <option key={unit} value={unit}>
                                {unit}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {showImageUpload && (
                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                        Product Image
                    </label>
                    <div className="space-y-3">
                        <input
                            type="file"
                            id="image"
                            name="image"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-sm text-gray-500">
                            Optional: Upload a product image (JPG, PNG, or WebP, max 5MB)
                        </p>

                        {imagePreview && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                                <div className="relative w-48 h-48 border border-gray-300 rounded-lg overflow-hidden">
                                    <Image
                                        src={imagePreview}
                                        alt="Product preview"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                {selectedFile && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex gap-3 pt-4">
                <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                >
                    {loading ? 'Processing...' : submitLabel}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                >
                    Cancel
                </Button>
            </div>
        </form>
    )
}

