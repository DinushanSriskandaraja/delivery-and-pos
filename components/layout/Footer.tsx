export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">GroceryShop</h3>
                        <p className="text-gray-400 text-sm">
                            Your unified grocery marketplace and POS platform. Connecting consumers, shops, and delivery partners.
                        </p>
                    </div>

                    {/* For Consumers */}
                    <div>
                        <h4 className="text-sm font-semibold mb-4 text-gray-300">For Consumers</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="/consumer" className="hover:text-white transition-colors">Browse Shops</a></li>
                            <li><a href="/consumer/orders" className="hover:text-white transition-colors">Track Orders</a></li>
                            <li><a href="/auth/register" className="hover:text-white transition-colors">Sign Up</a></li>
                        </ul>
                    </div>

                    {/* For Shop Owners */}
                    <div>
                        <h4 className="text-sm font-semibold mb-4 text-gray-300">For Shop Owners</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="/shop-owner" className="hover:text-white transition-colors">Dashboard</a></li>
                            <li><a href="/shop-owner/pos" className="hover:text-white transition-colors">POS System</a></li>
                            <li><a href="/auth/register" className="hover:text-white transition-colors">Register Shop</a></li>
                        </ul>
                    </div>

                    {/* For Delivery Partners */}
                    <div>
                        <h4 className="text-sm font-semibold mb-4 text-gray-300">For Delivery Partners</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="/delivery" className="hover:text-white transition-colors">Dashboard</a></li>
                            <li><a href="/delivery/orders" className="hover:text-white transition-colors">My Deliveries</a></li>
                            <li><a href="/auth/register" className="hover:text-white transition-colors">Join Us</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                    <p>&copy; {new Date().getFullYear()} GroceryShop. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
