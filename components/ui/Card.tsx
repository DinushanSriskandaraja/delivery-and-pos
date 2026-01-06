import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
    children: ReactNode
    className?: string
    onClick?: () => void
    hoverable?: boolean
}

export default function Card({ children, className, onClick, hoverable = false }: CardProps) {
    return (
        <div
            className={cn(
                'bg-white rounded-xl shadow-md border border-gray-200 p-6',
                hoverable && 'transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer',
                onClick && 'cursor-pointer',
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
    return <h3 className={cn('text-xl font-semibold text-gray-900', className)}>{children}</h3>
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
    return <p className={cn('text-sm text-gray-600 mt-1', className)}>{children}</p>
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('', className)}>{children}</div>
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('mt-4 pt-4 border-t border-gray-200', className)}>{children}</div>
}
