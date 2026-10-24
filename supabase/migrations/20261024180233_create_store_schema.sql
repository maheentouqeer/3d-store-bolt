/*
# Create Omega 3D Store schema with seed data

1. New Tables
- `products`: id, sku, name, category, price, shape (box/bottle/bag), color (hex), aisle (0-7), slot_index (0-11)
- `shelf_slots`: id, aisle (0-7), side (0=left, 1=right), z_index (0-5), pos_x, pos_y, pos_z, product_id
- `stock`: slot_id (FK to shelf_slots), qty, min_qty, updated_at
- `orders`: id, order_number, subtotal, tax, total, status, payment_method, created_at
- `order_items`: id, order_id, product_id, product_name, price, qty

2. Security
- products: SELECT for anon+authenticated (shoppers browse); INSERT/UPDATE/DELETE for authenticated (managers)
- shelf_slots: SELECT for anon+authenticated; INSERT/UPDATE/DELETE for authenticated
- stock: SELECT for anon+authenticated; INSERT/UPDATE/DELETE for authenticated
- orders: INSERT for anon+authenticated (checkout); SELECT for authenticated (managers view orders)
- order_items: INSERT for anon+authenticated; SELECT for authenticated

3. Seed Data
- 8 aisles (Beauty, Pharmacy, Food, Drinks, Apparel, Electronics, Home, Kids)
- 12 products per aisle = 96 products total
- 96 shelf_slots with computed 3D positions
- 96 stock records with random quantities (some low-stock for demo)
*/

-- ============ TABLES ============

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  price numeric(10,2) NOT NULL,
  shape text NOT NULL DEFAULT 'box',
  color text NOT NULL DEFAULT '#cccccc',
  aisle int NOT NULL,
  slot_index int NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shelf_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aisle int NOT NULL,
  side int NOT NULL,
  z_index int NOT NULL,
  pos_x float NOT NULL,
  pos_y float NOT NULL,
  pos_z float NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(aisle, side, z_index)
);

CREATE TABLE IF NOT EXISTS stock (
  slot_id uuid PRIMARY KEY REFERENCES shelf_slots(id) ON DELETE CASCADE,
  qty int NOT NULL DEFAULT 0,
  min_qty int NOT NULL DEFAULT 10,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  payment_method text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_name text NOT NULL,
  price numeric(10,2) NOT NULL,
  qty int NOT NULL DEFAULT 1
);

-- ============ RLS ============

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelf_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- products: public read, manager write
GRANT SELECT ON products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON products TO authenticated;

DROP POLICY IF EXISTS "read_products" ON products;
CREATE POLICY "read_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manager_insert_products" ON products;
CREATE POLICY "manager_insert_products" ON products FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "manager_update_products" ON products;
CREATE POLICY "manager_update_products" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "manager_delete_products" ON products;
CREATE POLICY "manager_delete_products" ON products FOR DELETE TO authenticated USING (true);

-- shelf_slots: public read, manager write
GRANT SELECT ON shelf_slots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON shelf_slots TO authenticated;

DROP POLICY IF EXISTS "read_shelf_slots" ON shelf_slots;
CREATE POLICY "read_shelf_slots" ON shelf_slots FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manager_insert_slots" ON shelf_slots;
CREATE POLICY "manager_insert_slots" ON shelf_slots FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "manager_update_slots" ON shelf_slots;
CREATE POLICY "manager_update_slots" ON shelf_slots FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "manager_delete_slots" ON shelf_slots;
CREATE POLICY "manager_delete_slots" ON shelf_slots FOR DELETE TO authenticated USING (true);

-- stock: public read, manager write
GRANT SELECT ON stock TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON stock TO authenticated;

DROP POLICY IF EXISTS "read_stock" ON stock;
CREATE POLICY "read_stock" ON stock FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manager_insert_stock" ON stock;
CREATE POLICY "manager_insert_stock" ON stock FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "manager_update_stock" ON stock;
CREATE POLICY "manager_update_stock" ON stock FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "manager_delete_stock" ON stock;
CREATE POLICY "manager_delete_stock" ON stock FOR DELETE TO authenticated USING (true);

-- orders: public insert (checkout), manager read
GRANT INSERT ON orders TO anon, authenticated;
GRANT SELECT ON orders TO authenticated;

DROP POLICY IF EXISTS "insert_orders" ON orders;
CREATE POLICY "insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "manager_read_orders" ON orders;
CREATE POLICY "manager_read_orders" ON orders FOR SELECT TO authenticated USING (true);

-- order_items: public insert, manager read
GRANT INSERT ON order_items TO anon, authenticated;
GRANT SELECT ON order_items TO authenticated;

DROP POLICY IF EXISTS "insert_order_items" ON order_items;
CREATE POLICY "insert_order_items" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "manager_read_order_items" ON order_items;
CREATE POLICY "manager_read_order_items" ON order_items FOR SELECT TO authenticated USING (true);

-- ============ SEED DATA ============

DO $$
DECLARE
  categories text[] := ARRAY['Beauty','Pharmacy','Food','Drinks','Apparel','Electronics','Home','Kids'];
  -- Product names per category (12 each)
  beauty_names text[] := ARRAY['Velvet Matte Lipstick','Silk Foundation SPF15','Hydra Glow Serum','Bamboo Hair Brush','Argan Oil Conditioner','Rosewater Toner','Cashmere Body Lotion','Velvet Eyeshadow Palette','Pearl Highlighter','Silk Cleansing Foam','Cocoa Butter Scrub','Matte Brow Pen'];
  pharmacy_names text[] := ARRAY['Pain Relief Tablets 20pk','Vitamin C 1000mg','Digital Thermometer','Adhesive Bandages 40pk','Antiseptic Wipes 30pk','Cough Syrup 150ml','Vitamin D3 Capsules','First Aid Kit','Elastic Bandage','Nasal Saline Spray','Hand Sanitizer 250ml','Mineral Sunscreen SPF50'];
  food_names text[] := ARRAY['Organic Olive Oil 500ml','Sea Salt Grinder','Wildflower Honey 350g','Artisan Pasta 500g','Dark Chocolate 70%','Arabica Coffee Beans 250g','Green Tea Bags 50pk','Basmati Rice 1kg','Maple Syrup 250ml','Balsamic Vinegar 250ml','Granola Cluster 400g','Sundried Tomatoes Jar'];
  drinks_names text[] := ARRAY['Sparkling Water 6pk','Cold Brew Coffee 330ml','Pomegranate Juice 1L','Coconut Water 330ml','Ginger Kombucha 330ml','Craft Lemonade 330ml','Almond Milk 1L','Matcha Latte Can 240ml','Orange Juice 1L','Tonic Water 4pk','Berry Smoothie 250ml','Sparkling Elderflower 750ml'];
  apparel_names text[] := ARRAY['Cotton Crew Tee','Merino Beanie','Linen Scarf','Leather Belt Canvas','Athletic Crew Socks 3pk','Denim Jacket','Wool Gloves','Canvas Tote Bag','Pima Polo Shirt','Fleece Hoodie','Stretch Joggers','Cashmere Blend Socks'];
  electronics_names text[] := ARRAY['Wireless Earbuds','USB-C Cable 2m','Bluetooth Speaker','Phone Charger 20W','LED Desk Lamp','Wireless Mouse','Power Bank 10000mAh','Smart Watch Band','Noise Canceling Headphones','Mechanical Keyboard','Webcam HD 1080p','Portable SSD 512GB'];
  home_names text[] := ARRAY['Ceramic Mug Set 4pk','Linen Cushion Cover','Scented Soy Candle','Stainless Water Bottle','Bamboo Cutlery Set','Cotton Bath Towel','Glass Storage Jars 3pk','Wool Throw Blanket','Ceramic Plant Pot','Silicone Food Containers','Cedar Coasters 6pk','Linen Table Runner'];
  kids_names text[] := ARRAY['Wooden Building Blocks 50pk','Plush Bear','Watercolor Set 24pk','Jump Rope','Glow Stars Pack 50','Origami Paper 200pk','Mini Robot Figure','Foam Glider Plane','Chalk Bucket 20pk','Sticker Collection 500pk','Rubber Bouncy Balls 6pk','Mini Puzzle 100pc'];
  
  all_names text[];
  cat_idx int;
  prod_idx int;
  prod_id uuid;
  slot_id uuid;
  aisle_x float;
  side int;
  z_idx int;
  pos_x float;
  pos_y float;
  pos_z float;
  z_positions float[] := ARRAY[-10.0, -6.0, -2.0, 2.0, 6.0, 10.0];
  base_prices float[] := ARRAY[12.99, 8.49, 24.99, 6.99, 11.99, 9.49, 7.99, 18.99, 14.99, 5.99, 13.49, 16.99];
  shapes text[] := ARRAY['box','bottle','box','box','bottle','box','box','box','box','bottle','bag','box'];
  colors text[] := ARRAY['#E8B4D0','#D4A5A5','#F4E4C1','#C8E6C9','#BBDEFB','#FFF9C4','#D7CCC8','#F8BBD9','#FFE0B2','#B3E5FC','#DCEDC8','#F0F4C3'];
  cat_colors text[];
  qty int;
  min_q int;
  sku_text text;
BEGIN
  FOR cat_idx IN 0..7 LOOP
    -- Select product names for this category
    CASE cat_idx
      WHEN 0 THEN all_names := beauty_names;
      WHEN 1 THEN all_names := pharmacy_names;
      WHEN 2 THEN all_names := food_names;
      WHEN 3 THEN all_names := drinks_names;
      WHEN 4 THEN all_names := apparel_names;
      WHEN 5 THEN all_names := electronics_names;
      WHEN 6 THEN all_names := home_names;
      WHEN 7 THEN all_names := kids_names;
    END CASE;
    
    aisle_x := -10.5 + cat_idx * 3.0;
    
    FOR prod_idx IN 0..11 LOOP
      side := prod_idx / 6;  -- 0 or 1
      z_idx := prod_idx % 6;  -- 0-5
      
      pos_x := CASE WHEN side = 0 THEN aisle_x - 0.55 ELSE aisle_x + 0.55 END;
      pos_y := 1.1;
      pos_z := z_positions[z_idx + 1];
      
      sku_text := 'OMG-' || lpad((cat_idx * 12 + prod_idx + 1)::text, 4, '0');
      
      -- Insert product
      INSERT INTO products (sku, name, category, price, shape, color, aisle, slot_index)
      VALUES (
        sku_text,
        all_names[prod_idx + 1],
        categories[cat_idx + 1],
        base_prices[prod_idx + 1] + cat_idx * 2.0,
        shapes[prod_idx + 1],
        colors[prod_idx + 1],
        cat_idx,
        prod_idx
      )
      RETURNING id INTO prod_id;
      
      -- Insert shelf slot
      INSERT INTO shelf_slots (aisle, side, z_index, pos_x, pos_y, pos_z, product_id)
      VALUES (cat_idx, side, z_idx, pos_x, pos_y, pos_z, prod_id)
      RETURNING id INTO slot_id;
      
      -- Insert stock with varied quantities
      qty := 20 + floor(random() * 60)::int;
      min_q := 10;
      -- Make some products low-stock for demo
      IF prod_idx = 2 OR prod_idx = 7 THEN
        qty := floor(random() * 8)::int;
      END IF;
      IF prod_idx = 5 AND cat_idx = 3 THEN
        qty := 0;
      END IF;
      
      INSERT INTO stock (slot_id, qty, min_qty) VALUES (slot_id, qty, min_q);
    END LOOP;
  END LOOP;
END $$;
