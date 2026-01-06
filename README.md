# GroceryShop Platform

A unified, location-based grocery marketplace and POS platform that connects consumers, shop owners, delivery partners, and admins.

## 🌟 Features

- **Multi-Role System**: Admin, Shop Owner, Consumer, and Delivery Partner roles
- **Global Product Catalog**: Centralized product management with shop-level pricing
- **Location-Based Discovery**: Find shops within a specified radius
- **Integrated POS System**: Process in-store sales with invoice generation
- **Order Management**: Support for delivery, pickup, and walk-in orders
- **Real-Time Inventory**: Track stock levels across all shops
- **Analytics & Reports**: Comprehensive sales and revenue tracking

## 🚀 Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for a 5-minute setup guide.

### ⚠️ Important: Disable Email Verification for Testing

For easier testing, disable email verification in Supabase:
1. Go to **Authentication** → **Providers** → **Email**
2. Uncheck "Confirm email"
3. Save

See [DISABLE_EMAIL_VERIFICATION.md](./DISABLE_EMAIL_VERIFICATION.md) for details.

## 📚 Documentation

- **[Quick Start Guide](./QUICKSTART.md)** - Get up and running in 5 minutes
- **[Disable Email Verification](./DISABLE_EMAIL_VERIFICATION.md)** - For testing
- **[Consumer Walkthrough](./consumer_walkthrough.md)** - Consumer features guide
- **[Implementation Plan](./implementation_plan.md)** - Complete feature specifications
- **[Database Schema](./supabase/schema.sql)** - Full database structure

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19
- **Styling**: TailwindCSS 4
- **Backend**: Next.js API Routes + Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS
- **Language**: TypeScript

## 📦 Project Structure

```
delivery-and-pos/
├── app/                 # Next.js app directory
│   ├── admin/          # Admin dashboard
│   ├── auth/           # Authentication pages
│   ├── consumer/       # Consumer app (complete)
│   └── page.tsx        # Landing page
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   └── layout/        # Layout components
├── lib/               # Utilities and helpers
│   ├── supabase/      # Supabase clients
│   ├── types/         # TypeScript types
│   └── utils.ts       # Helper functions
└── supabase/          # Database schema
```

## 🎯 Current Status

✅ **Phase 1 Complete**: Foundation & Setup
- Supabase integration
- Authentication system
- UI component library
- Database schema
- Landing page & Admin dashboard

✅ **Phase 4 Complete**: Consumer Experience
- Location-based shop discovery
- Product browsing & filtering
- Shopping cart & checkout
- Order tracking & reviews
- Profile & address management

🚧 **Next Phases**:
- Shop Owner Dashboard
- Delivery Partner App
- POS System
- Admin Product Management

## 🤝 Contributing

This is a comprehensive platform with many features. See the implementation plan for areas that need development.

## 📄 License

MIT
