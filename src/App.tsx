import React, { useState, useEffect } from 'react';
import { Menu } from './components/Menu';
import { Cart } from './components/Cart';
import { Auth } from './components/Auth';
import { UserMenu } from './components/UserMenu';
import { OrderTracking } from './components/OrderTracking';
import { StaffPanel } from './components/StaffPanel';
import { Toaster } from 'react-hot-toast';
import { Pizza } from 'lucide-react';
import { supabase } from './lib/supabase';

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [view, setView] = useState<'menu' | 'orders' | 'staff'>('menu');

  useEffect(() => {
    checkStaffStatus();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkStaffStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkStaffStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Check if user's email is a staff email (you can modify this logic)
      setIsStaff(user.email?.endsWith('@pizzapalace.com') || false);
    } else {
      setIsStaff(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Pizza className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-800">Pizza Palace</h1>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setView('menu')}
                  className={`px-3 py-2 rounded-md ${
                    view === 'menu'
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Menu
                </button>
                <button
                  onClick={() => setView('orders')}
                  className={`px-3 py-2 rounded-md ${
                    view === 'orders'
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  My Orders
                </button>
                {isStaff && (
                  <button
                    onClick={() => setView('staff')}
                    className={`px-3 py-2 rounded-md ${
                      view === 'staff'
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Staff Panel
                  </button>
                )}
              </nav>
              <UserMenu onSignInClick={() => setIsAuthOpen(true)} />
            </div>
          </div>
        </div>
      </header>
      
      {view === 'menu' && <Menu />}
      {view === 'orders' && <OrderTracking />}
      {view === 'staff' && isStaff && <StaffPanel />}
      <Cart />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;