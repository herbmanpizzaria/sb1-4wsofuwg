import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
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

export function OrderTracking() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    // Subscribe to order updates
    const channel = supabase
      .channel('order-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
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

      setOrders(orders || []);
    } catch (error: any) {
      toast.error('Error loading orders');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <ClipboardList className="w-6 h-6 text-red-500 mr-2" />
        <h2 className="text-2xl font-semibold">Your Orders</h2>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No orders found. Start ordering some delicious pizza!
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Order ID: {order.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <div>
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
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-right font-semibold">
                  Total: ${order.total_amount.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}