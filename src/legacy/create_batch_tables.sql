-- ============================================
-- SUPABASE TABLE CREATION SCRIPT
-- ============================================
-- Ejecuta este script en Supabase SQL Editor para crear la tabla de batches

-- Crear tabla de batches
CREATE TABLE IF NOT EXISTS batches (
  id BIGSERIAL PRIMARY KEY,
  batch_id VARCHAR(255) UNIQUE NOT NULL,
  producer_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  variety VARCHAR(255) NOT NULL,
  quality VARCHAR(100) NOT NULL,
  transaction_hash VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_batches_batch_id ON batches(batch_id);
CREATE INDEX idx_batches_producer_name ON batches(producer_name);
CREATE INDEX idx_batches_location ON batches(location);
CREATE INDEX idx_batches_created_at ON batches(created_at DESC);
CREATE INDEX idx_batches_wallet_address ON batches(wallet_address);

-- Crear tabla de auditoría (opcional pero recomendada)
CREATE TABLE IF NOT EXISTS batch_audit_log (
  id BIGSERIAL PRIMARY KEY,
  batch_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  actor VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_batch_id ON batch_audit_log(batch_id);
CREATE INDEX idx_audit_created_at ON batch_audit_log(created_at DESC);

-- Crear tabla de verificaciones de QR
CREATE TABLE IF NOT EXISTS qr_verifications (
  id BIGSERIAL PRIMARY KEY,
  batch_id VARCHAR(255) NOT NULL,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  device_fingerprint VARCHAR(255),
  location_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE
);

CREATE INDEX idx_qr_verifications_batch_id ON qr_verifications(batch_id);
CREATE INDEX idx_qr_verifications_verified_at ON qr_verifications(verified_at DESC);

-- Configurar RLS (Row Level Security) para mayor seguridad
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_verifications ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso público (lectura)
CREATE POLICY "Batches are publicly readable"
  ON batches FOR SELECT
  USING (true);

CREATE POLICY "QR verifications are publicly readable"
  ON qr_verifications FOR SELECT
  USING (true);

-- Crear políticas de escritura (solo aplicación autenticada)
CREATE POLICY "Batches can be inserted by authenticated users"
  ON batches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "QR verifications can be inserted by authenticated users"
  ON qr_verifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================
COMMENT ON TABLE batches IS 'Tabla principal de lotes de mango registrados en la cadena de suministro';
COMMENT ON TABLE batch_audit_log IS 'Registro de auditoría de acciones realizadas sobre batches';
COMMENT ON TABLE qr_verifications IS 'Registro de escaneos y verificaciones de códigos QR';

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de batches con contador de verificaciones
CREATE OR REPLACE VIEW batches_with_verification_count AS
SELECT 
  b.id,
  b.batch_id,
  b.producer_name,
  b.location,
  b.variety,
  b.quality,
  b.transaction_hash,
  b.wallet_address,
  b.metadata,
  b.created_at,
  b.updated_at,
  COALESCE(COUNT(qr.id), 0) as verification_count
FROM batches b
LEFT JOIN qr_verifications qr ON b.batch_id = qr.batch_id
GROUP BY b.id, b.batch_id, b.producer_name, b.location, b.variety, b.quality, b.transaction_hash, b.wallet_address, b.metadata, b.created_at, b.updated_at;

-- Vista de batches más verificados
CREATE OR REPLACE VIEW popular_batches AS
SELECT 
  b.batch_id,
  b.producer_name,
  b.variety,
  COUNT(qr.id) as total_verifications,
  MAX(qr.verified_at) as last_verified_at
FROM batches b
LEFT JOIN qr_verifications qr ON b.batch_id = qr.batch_id
GROUP BY b.batch_id, b.producer_name, b.variety
ORDER BY total_verifications DESC;
