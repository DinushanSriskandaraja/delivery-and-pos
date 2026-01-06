'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/lib/constants'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function RegisterPage() {
    const router = useRouter()

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        phone: '',
        role: UserRole.CONSUMER,
    })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setIsLoading(true)

        try {
            const supabase = createClient()

            // Sign up user (email verification disabled for testing)
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        full_name: formData.full_name,
                        phone: formData.phone,
                        role: formData.role,
                    }
                }
            })

            if (signUpError) throw signUpError

            if (authData.user) {
                // Create user profile
                const { error: profileError } = await supabase
                    .from('users')
                    .insert({
                        id: authData.user.id,
                        email: formData.email,
                        full_name: formData.full_name,
                        phone: formData.phone,
                        role: formData.role,
                    })

                if (profileError) throw profileError

                // Redirect based on role
                const roleRoutes: Record<string, string> = {
                    admin: '/admin',
                    shop_owner: '/shop-owner',
                    consumer: '/consumer',
                    delivery_partner: '/delivery',
                }

                router.push(roleRoutes[formData.role] || '/')
                router.refresh()
            }
        } catch (err: any) {
            setError(err.message || 'Failed to register')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 px-4 py-12">
            <Card className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl mb-4">
                        <span className="text-white font-bold text-3xl">G</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-gray-600 mt-2">Join GroceryShop today</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Full Name"
                        name="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                    />

                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                    />

                    <Input
                        label="Phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+94 77 123 4567"
                        required
                    />

                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                            I am a <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                        >
                            <option value={UserRole.CONSUMER}>Consumer</option>
                            <option value={UserRole.SHOP_OWNER}>Shop Owner</option>
                            <option value={UserRole.DELIVERY_PARTNER}>Delivery Partner</option>
                        </select>
                    </div>

                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        helperText="At least 6 characters"
                        required
                    />

                    <Input
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        isLoading={isLoading}
                    >
                        Create Account
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Sign in
                    </Link>
                </div>
            </Card>
        </div>
    )
}
