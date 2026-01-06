'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { approveProductRequest, rejectProductRequest } from '@/app/admin/products/actions'

interface ProductRequestCardProps {
    request: any
}

export default function ProductRequestCard({ request }: ProductRequestCardProps) {
    const [loading, setLoading] = useState(false)

    const handleApprove = async () => {
        if (!confirm('Are you sure you want to approve this product request?')) return
        setLoading(true)
        try {
            const result = await approveProductRequest(request.id)
            if (result.error) {
                alert(result.error)
            }
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        if (!confirm('Are you sure you want to reject this request?')) return
        setLoading(true)
        try {
            const result = await rejectProductRequest(request.id)
            if (result.error) {
                alert(result.error)
            }
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{request.product_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Category: {request.category}</span>
                        <span>•</span>
                        <span>Unit: {request.base_unit || 'N/A'}</span>
                        <span>•</span>
                        <span>Requested by: {request.shops?.name}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={handleApprove}
                        disabled={loading}
                    >
                        {loading ? '...' : 'Approve'}
                    </Button>
                    <Button
                        size="sm"
                        variant="danger"
                        onClick={handleReject}
                        disabled={loading}
                    >
                        {loading ? '...' : 'Reject'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
