import Link from "next/link";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function Home() {
  const features = [
    {
      title: "For Consumers",
      description: "Discover nearby grocery shops, browse products, and order for delivery or pickup",
      icon: "🛒",
      link: "/auth/register",
    },
    {
      title: "For Shop Owners",
      description: "Manage inventory, process orders, and use integrated POS system for walk-in customers",
      icon: "🏪",
      link: "/auth/register",
    },
    {
      title: "For Delivery Partners",
      description: "Accept delivery requests, navigate to locations, and earn by delivering orders",
      icon: "🚚",
      link: "/auth/register",
    },
    {
      title: "Location-Based Discovery",
      description: "Find shops within your area with distance-limited search and real-time availability",
      icon: "📍",
      link: "/consumer",
    },
    {
      title: "Integrated POS System",
      description: "Process in-store sales, generate invoices, and track inventory in real-time",
      icon: "💳",
      link: "/shop-owner/pos",
    },
    {
      title: "Comprehensive Analytics",
      description: "Track sales, revenue, and inventory with detailed reports and insights",
      icon: "📊",
      link: "/shop-owner/reports",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl mb-8 shadow-xl">
              <span className="text-white font-bold text-4xl">G</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-emerald-600">GroceryShop</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A unified, location-based grocery marketplace and POS platform connecting consumers, shop owners, and delivery partners
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button variant="primary" size="lg">
                  Get Started
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600">
              Powerful features for every role in the grocery ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} hoverable>
                <CardHeader>
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={feature.link}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Learn More →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Grocery Business?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands of shops, consumers, and delivery partners already using GroceryShop
          </p>
          <Link href="/auth/register">
            <Button variant="secondary" size="lg">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">GroceryShop</h3>
              <p className="text-gray-400 text-sm">
                Your unified grocery marketplace and POS platform
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-gray-300">For Consumers</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/consumer" className="hover:text-white">Browse Shops</Link></li>
                <li><Link href="/consumer/orders" className="hover:text-white">Track Orders</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-gray-300">For Shop Owners</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/shop-owner" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/shop-owner/pos" className="hover:text-white">POS System</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-gray-300">For Delivery Partners</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/delivery" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/delivery/orders" className="hover:text-white">My Deliveries</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} GroceryShop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
