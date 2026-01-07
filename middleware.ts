import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser()

    // Protected routes by role
    const protectedRoutes = {
        admin: ['/admin'],
        shop_owner: ['/shop-owner'],
        // Consumer routes handled separately below
        delivery_partner: ['/delivery'],
    }

    const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/callback']
    const pathname = request.nextUrl.pathname

    // Allow public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return supabaseResponse
    }

    // Special handling for consumer routes
    if (pathname.startsWith('/consumer')) {
        // Protect strict user routes
        if (pathname.startsWith('/consumer/profile') || pathname.startsWith('/consumer/checkout')) {
            if (!user) {
                const url = request.nextUrl.clone()
                url.pathname = '/auth/login'
                url.searchParams.set('redirect', pathname)
                return NextResponse.redirect(url)
            }
            // Check role if logged in
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()

            if (userData && userData.role !== 'consumer') {
                const url = request.nextUrl.clone()
                url.pathname = `/${userData.role.replace('_', '-')}`
                return NextResponse.redirect(url)
            }
        }
        // Allow access to other consumer routes (dashboard, shop details, etc.)
        return supabaseResponse
    }

    // Strict auth for other protected routes
    if (!user) {
        // Only redirect if matching a protected route
        const isProtected = Object.values(protectedRoutes).flat().some(route => pathname.startsWith(route))
        if (isProtected) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            url.searchParams.set('redirect', pathname)
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }

    // Get user role from database for role verification
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
    }

    const userRole = userData.role

    // Check if user has access to the requested route
    for (const [role, routes] of Object.entries(protectedRoutes)) {
        if (routes.some(route => pathname.startsWith(route))) {
            if (userRole !== role) {
                // Redirect to user's dashboard
                const url = request.nextUrl.clone()
                url.pathname = `/${userRole.replace('_', '-')}`
                return NextResponse.redirect(url)
            }
        }
    }

    return supabaseResponse
}

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
