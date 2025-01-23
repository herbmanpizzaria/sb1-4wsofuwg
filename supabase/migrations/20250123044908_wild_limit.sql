/*
  # Add admin role and permissions

  1. Changes
    - Create new admin role
    - Grant admin role to specific user
    - Update RLS policies to allow admin access

  2. Security
    - Add admin-specific policies for orders table
    - Ensure admins can view and manage all orders
*/

-- Create a new role for admins
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Add role column to auth.users
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- Update specific user to admin
UPDATE auth.users 
SET role = 'admin' 
WHERE email = 'test2@pizzapalace.com';

-- Update orders policies to allow admin access
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.uid() = user_id
  );

-- Update order items policies
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Update order item toppings policies
CREATE POLICY "Admins can view all order item toppings"
  ON order_item_toppings FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE order_items.id = order_item_toppings.order_item_id
      AND orders.user_id = auth.uid()
    )
  );