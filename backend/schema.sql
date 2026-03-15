CREATE TABLE IF NOT EXISTS floor_styles (
  id SERIAL PRIMARY KEY,
  key VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  tone VARCHAR(80) NOT NULL,
  badge VARCHAR(80) NOT NULL,
  primary_color VARCHAR(20) NOT NULL,
  secondary_color VARCHAR(20) NOT NULL,
  accent_color VARCHAR(20) NOT NULL,
  texture_scale DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preview_jobs (
  id VARCHAR(36) PRIMARY KEY,
  floor_style_id INTEGER REFERENCES floor_styles(id),
  original_image_path TEXT NOT NULL,
  result_image_path TEXT,
  mask_image_path TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'uploaded',
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(36) PRIMARY KEY,
  preview_job_id VARCHAR(36) REFERENCES preview_jobs(id),
  name VARCHAR(120),
  phone VARCHAR(60),
  line_id VARCHAR(120),
  message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_requests (
  id VARCHAR(36) PRIMARY KEY,
  reference VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(60) NOT NULL,
  line_id VARCHAR(120),
  request_type VARCHAR(80) NOT NULL,
  installation_address TEXT,
  size_info VARCHAR(160),
  message TEXT NOT NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_products (
  id SERIAL PRIMARY KEY,
  category VARCHAR(20) NOT NULL,
  form VARCHAR(40) NOT NULL,
  code VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  unit_label VARCHAR(20) NOT NULL DEFAULT 'set',
  price_per_square_meter NUMERIC(12, 2) NOT NULL,
  fullness_factor DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  rail_price_per_meter NUMERIC(12, 2) NOT NULL DEFAULT 0,
  labor_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  minimum_charge NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_formula_settings (
  id SERIAL PRIMARY KEY,
  form VARCHAR(40) UNIQUE NOT NULL,
  display_name VARCHAR(80) NOT NULL,
  material_unit_price_default NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_rate NUMERIC(8, 4),
  rail_price_per_chi NUMERIC(12, 2),
  labor_price NUMERIC(12, 2),
  fabric_width_chi NUMERIC(8, 2),
  fabric_multiplier NUMERIC(8, 2),
  minimum_billable_talents INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes (
  id VARCHAR(36) PRIMARY KEY,
  quote_number VARCHAR(30) UNIQUE NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(60),
  installation_address TEXT,
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remarks TEXT,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_items (
  id VARCHAR(36) PRIMARY KEY,
  quote_id VARCHAR(36) NOT NULL REFERENCES quotes(id),
  product_id INTEGER NOT NULL REFERENCES quote_products(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(20) NOT NULL,
  form VARCHAR(40) NOT NULL,
  location_name VARCHAR(120),
  custom_model VARCHAR(120),
  pricing_unit VARCHAR(20),
  material_unit_price NUMERIC(12, 2),
  product_code VARCHAR(40) NOT NULL,
  product_name VARCHAR(120) NOT NULL,
  width_cm NUMERIC(10, 2) NOT NULL,
  height_cm NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  formula_summary TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
