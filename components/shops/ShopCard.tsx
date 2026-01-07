import Link from 'next/link'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export interface Shop {
    id: string
    name: string
    description: string
    address: string
    latitude: number
    longitude: number
    delivery_range_km: number
    distance?: number
    rating?: number
    review_count?: number
}

interface ShopCardProps {
    shop: Shop
}

export default function ShopCard({ shop }: ShopCardProps) {
    return (
        <Link href={`/consumer/shops/${shop.id}`} className="group">
            <Card hoverable className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col">
                <div className="h-24 bg-gradient-to-r from-emerald-100 to-teal-50 relative">
                    <div className="absolute bottom-4 left-6">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center text-3xl ring-4 ring-white">
                            🏪
                        </div>
                    </div>
                </div>
                <CardHeader className="pt-2 pb-2">
                    <div className="flex justify-between items-start pl-20">
                        <div className="flex flex-col items-end w-full">
                            {shop.rating && shop.rating > 0 ? (
                                <Badge variant="warning" className="flex items-center gap-1 shadow-sm">
                                    <span>★</span> {shop.rating.toFixed(1)}
                                </Badge>
                            ) : (
                                <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-lg">New</span>
                            )}
                        </div>
                    </div>
                    <div className="mt-4">
                        <CardTitle className="text-xl group-hover:text-emerald-700 transition-colors">{shop.name}</CardTitle>
                        <CardDescription className="mt-2 line-clamp-2 text-sm">{shop.description}</CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="flex-grow flex flex-col justify-end pt-0">
                    <div className="mt-4 space-y-3 border-t border-gray-50 pt-4">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md">
                                <span className="mr-2 text-emerald-500">📍</span>
                                <span className="font-medium">{shop.distance?.toFixed(1)} km</span>
                            </div>
                            <div className="flex items-center text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                                <span className="mr-2">🚚</span>
                                <span className="font-medium">
                                    {shop.delivery_range_km === 0
                                        ? 'Pickup Only (Within 5 km)'
                                        : `Within ${shop.delivery_range_km ?? 5} km`
                                    }
                                </span>
                            </div>
                        </div>
                        <div className="flex items-start text-xs text-gray-400 px-1">
                            <span className="mr-1.5 mt-0.5">🏠</span>
                            <span className="line-clamp-1">{shop.address}</span>
                        </div>
                    </div>
                </CardContent>
                <div className="bg-gray-50 p-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0">
                    <p className="text-center text-emerald-600 font-semibold text-sm">Visit Store →</p>
                </div>
            </Card>
        </Link>
    )
}
