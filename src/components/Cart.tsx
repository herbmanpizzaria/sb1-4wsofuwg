import React, { useState } from 'react';
import { useCartStore } from '../store/cart';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please sign in to place an order');
        return;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total(),
          status: 'pending',
        })
        .select()
        .single();

      if (orderError || !order) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        notes: item.notes,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const orderItemToppings = items.flatMap((item) =>
        item.toppings.map((topping) => ({
          order_item_id: order.id,
          topping_id: topping.id,
        }))
      );

      if (orderItemToppings.length > 0) {
        const { error: toppingsError } = await supabase
          .from('order_item_toppings')
          .insert(orderItemToppings);

        if (toppingsError) throw toppingsError;
      }

      clearCart();
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-96 bg-white shadow-lg rounded-t-lg">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingCart className="w-6 h-6 mr-2" />
            <h2 className="text-lg font-semibold">Your Cart</h2>
          </div>
          <span className="text-lg font-bold">${total().toFixed(2)}</span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto p-4">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center">Your cart is empty</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-start space-x-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{item.product.name}</h3>
                  {item.toppings.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Toppings: {item.toppings.map((t) => t.name).join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-sm text-gray-600">Notes: {item.notes}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.product.id, parseInt(e.target.value))
                    }
                    className="w-16 p-1 border rounded text-center"
                  />
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <button
          onClick={handleSubmitOrder}
          disabled={items.length === 0 || isSubmitting}
          className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}