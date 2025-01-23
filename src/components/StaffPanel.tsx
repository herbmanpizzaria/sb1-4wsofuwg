import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChefHat, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  user_id: string;
  user_email: string;
  items: {
    product: {
      name: string;
    };
    quantity: number;
    toppings: {
      name: string;
    }[];
    notes?: string;
  }[];
}

export function StaffPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    // Subscribe to order updates
    const channel = supabase
      .channel('staff-order-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
      }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            quantity,
            notes,
            product:products(name),
            toppings:order_item_toppings(
              topping:toppings(name)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get the current user's email to identify staff status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email?.endsWith('@pizzapalace.com')) {
        throw new Error('Unauthorized access');
      }

      setOrders(orders || []);
    } catch (error: any) {
      toast.error('Error loading orders');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(`Order marked as ${status}`);
    } catch (error: any) {
      toast.error('Error updating order status');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <ChefHat className="w-6 h-6 text-red-500 mr-2" />
        <h2 className="text-2xl font-semibold">Staff Order Management</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['pending', 'preparing', 'ready', 'completed'].map((status) => (
          <div key={status} className="space-y-4">
            <h3 className="text-lg font-semibold capitalize">{status}</h3>
            {orders
              .filter((order) => order.status === status)
              .map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-md p-4"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Order ID: {order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Customer ID: {order.user_id.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index}>
                        <p className="font-medium">
                          {item.quantity}x {item.product.name}
                        </p>
                        {item.toppings.length > 0 && (
                          <p className="text-sm text-gray-600">
                            Toppings: {item.toppings.map((t) => t.topping.name).join(', ')}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-gray-600">Notes: {item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <p className="font-semibold mb-3">
                      Total: ${order.total_amount.toFixed(2)}
                    </p>
                    <div className="flex space-x-2">
                      {status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Start Preparing
                        </button>
                      )}
                      {status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="flex items-center px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Ready
                        </button>
                      )}
                      {status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="flex items-center px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}