/*
  # Pizza Ordering System Schema

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name (e.g., Pizzas, Sides, Drinks)
      - `sort_order` (integer) - For controlling display order
      
    - `products`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `name` (text) - Product name
      - `description` (text) - Product description
      - `price` (decimal) - Base price
      - `image_url` (text) - Product image
      - `active` (boolean) - Whether product is available
      
    - `toppings`
      - `id` (uuid, primary key)
      - `name` (text) - Topping name
      - `price` (decimal) - Additional price
      - `active` (boolean) - Whether topping is available
      
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `status` (text) - Order status (pending, preparing, ready, delivered)
      - `total_amount` (decimal) - Total order amount
      - `created_at` (timestamp) - Order creation time
      - `notes` (text) - Special instructions
      
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `quantity` (integer) - Number of items
      - `unit_price` (decimal) - Price at time of order
      - `notes` (text) - Special instructions per item
      
    - `order_item_toppings`
      - `id` (uuid, primary key)
      - `order_item_id` (uuid, foreign key)
      - `topping_id` (uuid, foreign key)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Categories are editable by authenticated users only"
  ON categories FOR ALL
  TO authenticated
  USING (true);

-- Products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  image_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Products are editable by authenticated users only"
  ON products FOR ALL
  TO authenticated
  USING (true);

-- Toppings table
CREATE TABLE toppings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE toppings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Toppings are viewable by everyone"
  ON toppings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Toppings are editable by authenticated users only"
  ON toppings FOR ALL
  TO authenticated
  USING (true);

-- Orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  total_amount decimal(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Order items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Order item toppings table
CREATE TABLE order_item_toppings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid REFERENCES order_items(id) ON DELETE CASCADE,
  topping_id uuid REFERENCES toppings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_item_toppings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order item toppings"
  ON order_item_toppings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE order_items.id = order_item_toppings.order_item_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own order item toppings"
  ON order_item_toppings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE order_items.id = order_item_toppings.order_item_id
      AND orders.user_id = auth.uid()
    )
  );

-- Insert initial categories
INSERT INTO categories (name, sort_order) VALUES
  ('Pizzas', 1),
  ('Sides', 2),
  ('Drinks', 3);

-- Insert sample products
INSERT INTO products (category_id, name, description, price, image_url) VALUES
  ((SELECT id FROM categories WHERE name = 'Pizzas'), 'Margherita', 'Fresh tomatoes, mozzarella, basil', 12.99, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80'),
  ((SELECT id FROM categories WHERE name = 'Pizzas'), 'Pepperoni', 'Classic pepperoni with mozzarella', 14.99, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80'),
  ((SELECT id FROM categories WHERE name = 'Sides'), 'Garlic Bread', 'Freshly baked with garlic butter', 4.99, 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=800&q=80'),
  ((SELECT id FROM categories WHERE name = 'Drinks'), 'Cola', 'Ice-cold cola', 2.99, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80');

-- Insert sample toppings
INSERT INTO toppings (name, price) VALUES
  ('Extra Cheese', 1.50),
  ('Mushrooms', 1.00),
  ('Pepperoni', 1.50),
  ('Olives', 1.00),
  ('Bell Peppers', 1.00),
  ('Onions', 1.00);