import { create } from 'zustand';
import { Database } from '../types/supabase';

type Product = Database['public']['Tables']['products']['Row'];
type Topping = Database['public']['Tables']['toppings']['Row'];

interface CartItem {
  product: Product;
  quantity: number;
  toppings: Topping[];
  notes?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  
  addItem: (item) => {
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (i) => i.product.id === item.product.id
      );

      if (existingItemIndex > -1) {
        const newItems = [...state.items];
        newItems[existingItemIndex].quantity += item.quantity;
        return { items: newItems };
      }

      return { items: [...state.items, item] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  total: () => {
    const { items } = get();
    return items.reduce((total, item) => {
      const toppingsTotal = item.toppings.reduce((sum, topping) => sum + topping.price, 0);
      return total + (item.product.price + toppingsTotal) * item.quantity;
    }, 0);
  },
}));