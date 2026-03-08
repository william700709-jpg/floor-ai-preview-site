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
