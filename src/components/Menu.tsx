import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { useCartStore } from '../store/cart';
import { Pizza } from 'lucide-react';
import toast from 'react-hot-toast';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Topping = Database['public']['Tables']['toppings']['Row'];

export function Menu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  
  const { addItem } = useCartStore();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [categoriesData, productsData, toppingsData] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').eq('active', true),
      supabase.from('toppings').select('*').eq('active', true),
    ]);

    if (categoriesData.data) setCategories(categoriesData.data);
    if (productsData.data) setProducts(productsData.data);
    if (toppingsData.data) setToppings(toppingsData.data);
  }

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    addItem({
      product: selectedProduct,
      quantity,
      toppings: selectedToppings,
      notes,
    });

    toast.success('Added to cart!');
    setSelectedProduct(null);
    setSelectedToppings([]);
    setQuantity(1);
    setNotes('');
  };

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings((current) =>
      current.find((t) => t.id === topping.id)
        ? current.filter((t) => t.id !== topping.id)
        : [...current, topping]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center mb-8">
        <Pizza className="w-8 h-8 mr-2 text-red-500" />
        <h1 className="text-3xl font-bold text-gray-800">Our Menu</h1>
      </div>

      {categories.map((category) => (
        <div key={category.id} className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{category.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products
              .filter((product) => product.category_id === category.id)
              .map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-4">Customize Your Order</h2>
            
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Toppings</h3>
              <div className="space-y-2">
                {toppings.map((topping) => (
                  <label key={topping.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedToppings.some((t) => t.id === topping.id)}
                      onChange={() => toggleTopping(topping)}
                      className="mr-2"
                    />
                    <span>{topping.name}</span>
                    <span className="ml-auto">${topping.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
                className="w-20 p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-2">Special Instructions</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCart}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}