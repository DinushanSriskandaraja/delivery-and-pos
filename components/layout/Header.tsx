'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '../ui/Button'

interface HeaderProps {
    user?: {
        email: string
        role: UserRole
        full_name: string
    }
}

export default function Header({ user }: HeaderProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    const getNavLinks = () => {
        if (!user) {
            return [
                { href: '/consumer', label: 'Browse Shops' },
                { href: '/consumer/cart', label: 'Cart' },
            ]
        }

        switch (user.role) {
            case UserRole.ADMIN:
                return [
                    { href: '/admin', label: 'Dashboard' },
                    { href: '/admin/products', label: 'Products' },
                    { href: '/admin/shops', label: 'Shops' },
                    { href: '/admin/users', label: 'Users' },
                ]
            case UserRole.SHOP_OWNER:
                return [
                    { href: '/shop-owner', label: 'Dashboard' },
                    { href: '/shop-owner/products', label: 'Products' },
                    { href: '/shop-owner/orders', label: 'Orders' },
                    { href: '/shop-owner/pos', label: 'POS' },
                    { href: '/shop-owner/reports', label: 'Reports' },
                    { href: '/shop-owner/settings', label: 'Settings' },
                ]
            case UserRole.CONSUMER:
                return [
                    { href: '/consumer', label: 'Browse Shops' },
                    { href: '/consumer/cart', label: 'Cart' },
                    { href: '/consumer/orders', label: 'Orders' },
                    { href: '/consumer/profile', label: 'Profile' },
                ]
            case UserRole.DELIVERY_PARTNER:
                return [
                    { href: '/delivery', label: 'Dashboard' },
                    { href: '/delivery/orders', label: 'My Deliveries' },
                ]
            default:
                return []
        }
    }

    const navLinks = getNavLinks()

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">G</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">GroceryShop</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex space-x-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === link.href
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleSignOut}>
                                    Sign Out
                                </Button>
                            </>
                        ) : (
                            <div className="space-x-2">
                                <Link href="/auth/login">
                                    <Button variant="outline" size="sm">
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/auth/register">
                                    <Button variant="primary" size="sm">
                                        Register
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
