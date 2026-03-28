-- ============================================
-- MIGRATION: Core Schema V2 - Etapa 1
-- ============================================
-- Fecha: 2026-03-27
-- Objetivo: Refactorizar de tabla monolítica batches a modelo normalizado
-- Tablas: lots, lot_attributes, lot_events, trust_states

-- ============================================
-- 1. TABLA: lots (Identidad Core)
-- ============================================

CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id VARCHAR(100) UNIQUE NOT NULL,
  producer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  origin_location VARCHAR(255) NOT NULL,
  harvest_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
ALTER TABLE lots ADD CONSTRAINT check_lot_id_format
  CHECK (lot_id ~ '^[A-Z]{2,4}-\d{4}-\d{3,6}$');

-- Índices
CREATE UNIQUE INDEX idx_lots_lot_id ON lots(lot_id);
CREATE INDEX idx_lots_producer_id ON lots(producer_id);
CREATE INDEX idx_lots_created_at ON lots(created_at DESC);
CREATE INDEX idx_lots_origin_location ON lots(origin_location);

-- Comentarios
COMMENT ON TABLE lots IS 'Identidad core de lotes - solo datos inmutables';
COMMENT ON COLUMN lots.lot_id IS 'Identificador único legible (ej: MG-2025-001)';
COMMENT ON COLUMN lots.origin_location IS 'Ubicación de origen del lote';
COMMENT ON COLUMN lots.harvest_date IS 'Fecha de cosecha (opcional)';
COMMENT ON COLUMN lots.metadata IS 'Metadata técnica del sistema (no de negocio)';

-- ============================================
-- 2. TABLA: lot_attributes (Propiedades Mutables)
-- ============================================

CREATE TABLE lot_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  attribute_key VARCHAR(100) NOT NULL,
  attribute_value TEXT NOT NULL,
  value_type VARCHAR(50) NOT NULL DEFAULT 'string',
  source VARCHAR(100) DEFAULT 'user_input',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(lot_id, attribute_key)
);

-- Índices
CREATE INDEX idx_lot_attrs_lot_id ON lot_attributes(lot_id);
CREATE INDEX idx_lot_attrs_key ON lot_attributes(attribute_key);
CREATE INDEX idx_lot_attrs_verified ON lot_attributes(verified);

-- Comentarios
COMMENT ON TABLE lot_attributes IS 'Atributos mutables de lotes (EAV pattern)';
COMMENT ON COLUMN lot_attributes.attribute_key IS 'Nombre del atributo (variety, quality, total_kg, etc)';
COMMENT ON COLUMN lot_attributes.value_type IS 'Tipo de dato (string, numeric, boolean)';
COMMENT ON COLUMN lot_attributes.source IS 'Origen del dato (user_input, sensor, certification)';
COMMENT ON COLUMN lot_attributes.verified IS 'Si el atributo ha sido verificado';

-- ============================================
-- 3. TABLA: lot_events (Timeline Inmutable)
-- ============================================

CREATE TABLE lot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  location VARCHAR(255),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_lot_events_lot_id ON lot_events(lot_id);
CREATE INDEX idx_lot_events_type ON lot_events(event_type);
CREATE INDEX idx_lot_events_category ON lot_events(event_category);
CREATE INDEX idx_lot_events_occurred_at ON lot_events(occurred_at DESC);
CREATE INDEX idx_lot_events_actor_id ON lot_events(actor_id);

-- Comentarios
COMMENT ON TABLE lot_events IS 'Eventos inmutables de cadena de suministro (append-only)';
COMMENT ON COLUMN lot_events.event_type IS 'Tipo específico de evento (lot.created, lot.shipped, etc)';
COMMENT ON COLUMN lot_events.event_category IS 'Categoría del evento (lifecycle, attribute_change, verification, custody)';
COMMENT ON COLUMN lot_events.occurred_at IS 'Cuándo ocurrió el evento (puede ser pasado)';
COMMENT ON COLUMN lot_events.created_at IS 'Cuándo se registró el evento en el sistema';

-- ============================================
-- 4. TABLA: trust_states (Estado de Confianza)
-- ============================================

CREATE TABLE trust_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  trust_score NUMERIC(5, 2) DEFAULT 0.00,
  verification_count INTEGER DEFAULT 0,
  evidence_count INTEGER DEFAULT 0,
  last_verified_at TIMESTAMPTZ,
  flags JSONB DEFAULT '[]'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(lot_id)
);

-- Constraints
ALTER TABLE trust_states ADD CONSTRAINT check_trust_score_range
  CHECK (trust_score >= 0 AND trust_score <= 100);

ALTER TABLE trust_states ADD CONSTRAINT check_positive_counts
  CHECK (verification_count >= 0 AND evidence_count >= 0);

-- Índices
CREATE UNIQUE INDEX idx_trust_states_lot_id ON trust_states(lot_id);
CREATE INDEX idx_trust_states_score ON trust_states(trust_score DESC);
CREATE INDEX idx_trust_states_verified_at ON trust_states(last_verified_at DESC);

-- Comentarios
COMMENT ON TABLE trust_states IS 'Estado actual de confianza de cada lote';
COMMENT ON COLUMN trust_states.trust_score IS 'Score de confianza (0-100)';
COMMENT ON COLUMN trust_states.verification_count IS 'Número de verificaciones QR';
COMMENT ON COLUMN trust_states.evidence_count IS 'Número de evidencias adjuntas';
COMMENT ON COLUMN trust_states.flags IS 'Array de flags/anomalías detectadas';

-- ============================================
-- 5. TABLA: qr_verifications (Escaneos QR)
-- ============================================

-- Nota: Esta tabla ya existe en migration anterior, pero la recreamos con ajustes

DROP TABLE IF EXISTS qr_verifications CASCADE;

CREATE TABLE qr_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_fingerprint VARCHAR(255),
  location_data JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX idx_qr_lot_id ON qr_verifications(lot_id);
CREATE INDEX idx_qr_verified_at ON qr_verifications(verified_at DESC);
CREATE INDEX idx_qr_device ON qr_verifications(device_fingerprint);
CREATE INDEX idx_qr_success ON qr_verifications(success);

-- Comentarios
COMMENT ON TABLE qr_verifications IS 'Registro de escaneos de códigos QR (append-only)';

-- ============================================
-- 6. TRIGGERS: Auto-actualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lots_updated_at
  BEFORE UPDATE ON lots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lot_attributes_updated_at
  BEFORE UPDATE ON lot_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. TRIGGER: Crear evento inicial al crear lote
-- ============================================

CREATE OR REPLACE FUNCTION create_initial_lot_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lot_events (
    lot_id,
    event_type,
    event_category,
    actor_id,
    location,
    description
  ) VALUES (
    NEW.id,
    'lot.created',
    'lifecycle',
    NEW.producer_id,
    NEW.origin_location,
    'Lote registrado en el sistema'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_initial_lot_event
  AFTER INSERT ON lots
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_lot_event();

-- ============================================
-- 8. TRIGGER: Crear trust_state inicial
-- ============================================

CREATE OR REPLACE FUNCTION create_initial_trust_state()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trust_states (
    lot_id,
    trust_score,
    verification_count,
    evidence_count
  ) VALUES (
    NEW.id,
    10.00,  -- Score base por creación
    0,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_initial_trust_state
  AFTER INSERT ON lots
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_trust_state();

-- ============================================
-- 9. TRIGGER: Actualizar trust_state en verificación
-- ============================================

CREATE OR REPLACE FUNCTION update_trust_on_verification()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE trust_states
  SET
    verification_count = verification_count + 1,
    last_verified_at = NEW.verified_at,
    trust_score = LEAST(100, trust_score + 2.0),  -- +2 puntos por verificación
    computed_at = NOW()
  WHERE lot_id = NEW.lot_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trust_on_verification
  AFTER INSERT ON qr_verifications
  FOR EACH ROW
  WHEN (NEW.success = true)
  EXECUTE FUNCTION update_trust_on_verification();

-- ============================================
-- 10. FUNCIÓN RPC: create_lot_complete
-- ============================================

CREATE OR REPLACE FUNCTION create_lot_complete(
  p_lot_id VARCHAR,
  p_producer_id UUID,
  p_origin_location VARCHAR,
  p_harvest_date DATE,
  p_attributes JSONB
)
RETURNS TABLE (
  lot_uuid UUID,
  lot_lot_id VARCHAR
) AS $$
DECLARE
  v_lot_id UUID;
  v_attr_key TEXT;
  v_attr_value TEXT;
BEGIN
  -- PASO 1: Insertar en lots
  INSERT INTO lots (
    lot_id,
    producer_id,
    origin_location,
    harvest_date
  ) VALUES (
    p_lot_id,
    p_producer_id,
    p_origin_location,
    p_harvest_date
  )
  RETURNING id INTO v_lot_id;

  -- PASO 2: Insertar atributos
  FOR v_attr_key, v_attr_value IN
    SELECT key, value::text
    FROM jsonb_each_text(p_attributes)
    WHERE value IS NOT NULL AND value::text != ''
  LOOP
    INSERT INTO lot_attributes (
      lot_id,
      attribute_key,
      attribute_value,
      value_type,
      source
    ) VALUES (
      v_lot_id,
      v_attr_key,
      v_attr_value,
      CASE
        WHEN v_attr_value ~ '^\d+(\.\d+)?$' THEN 'numeric'
        WHEN v_attr_value IN ('true', 'false') THEN 'boolean'
        ELSE 'string'
      END,
      'user_input'
    );
  END LOOP;

  -- PASO 3 y 4: Los triggers crean lot_events y trust_states automáticamente

  -- Retornar IDs
  RETURN QUERY
  SELECT v_lot_id, p_lot_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_lot_complete IS 'Crea un lote completo con atributos, evento inicial y trust_state en transacción atómica';

-- ============================================
-- 11. FUNCIÓN: get_lot_timeline
-- ============================================

CREATE OR REPLACE FUNCTION get_lot_timeline(p_lot_id VARCHAR)
RETURNS TABLE (
  event_id UUID,
  event_type VARCHAR,
  event_category VARCHAR,
  description TEXT,
  location VARCHAR,
  actor_name VARCHAR,
  occurred_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.event_type,
    e.event_category,
    e.description,
    e.location,
    p.full_name as actor_name,
    e.occurred_at
  FROM lot_events e
  JOIN lots l ON e.lot_id = l.id
  LEFT JOIN profiles p ON e.actor_id = p.id
  WHERE l.lot_id = p_lot_id
  ORDER BY e.occurred_at ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_lot_timeline IS 'Obtiene el timeline completo de eventos de un lote';

-- ============================================
-- 12. FUNCIÓN: get_lot_with_details
-- ============================================

CREATE OR REPLACE FUNCTION get_lot_with_details(p_lot_id VARCHAR)
RETURNS TABLE (
  lot_uuid UUID,
  lot_id VARCHAR,
  producer_id UUID,
  producer_name VARCHAR,
  origin_location VARCHAR,
  harvest_date DATE,
  created_at TIMESTAMPTZ,
  attributes JSONB,
  trust_score NUMERIC,
  verification_count INTEGER,
  last_verified_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.lot_id,
    l.producer_id,
    p.full_name,
    l.origin_location,
    l.harvest_date,
    l.created_at,
    COALESCE(
      jsonb_object_agg(
        la.attribute_key,
        la.attribute_value
      ) FILTER (WHERE la.attribute_key IS NOT NULL),
      '{}'::jsonb
    ) as attributes,
    ts.trust_score,
    ts.verification_count,
    ts.last_verified_at
  FROM lots l
  LEFT JOIN profiles p ON l.producer_id = p.id
  LEFT JOIN lot_attributes la ON l.id = la.lot_id
  LEFT JOIN trust_states ts ON l.id = ts.lot_id
  WHERE l.lot_id = p_lot_id
  GROUP BY l.id, l.lot_id, l.producer_id, p.full_name, l.origin_location, 
           l.harvest_date, l.created_at, ts.trust_score, ts.verification_count, 
           ts.last_verified_at;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_lot_with_details IS 'Obtiene un lote completo con atributos y trust_state';

-- ============================================
-- 13. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_verifications ENABLE ROW LEVEL SECURITY;

-- Políticas para lots
CREATE POLICY "Lots are viewable by everyone"
  ON lots FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create lots"
  ON lots FOR INSERT
  WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "Producers can update own lots"
  ON lots FOR UPDATE
  USING (auth.uid() = producer_id);

-- Políticas para lot_attributes
CREATE POLICY "Lot attributes are viewable by everyone"
  ON lot_attributes FOR SELECT
  USING (true);

CREATE POLICY "Lot attributes can be inserted with lot"
  ON lot_attributes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lots
      WHERE lots.id = lot_attributes.lot_id
        AND lots.producer_id = auth.uid()
    )
  );

CREATE POLICY "Producers can update own lot attributes"
  ON lot_attributes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lots
      WHERE lots.id = lot_attributes.lot_id
        AND lots.producer_id = auth.uid()
    )
  );

-- Políticas para lot_events
CREATE POLICY "Lot events are viewable by everyone"
  ON lot_events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON lot_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- NO UPDATE/DELETE en lot_events (append-only)

-- Políticas para trust_states
CREATE POLICY "Trust states are viewable by everyone"
  ON trust_states FOR SELECT
  USING (true);

-- Solo triggers pueden modificar trust_states
CREATE POLICY "Trust states can be inserted by system"
  ON trust_states FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Trust states can be updated by system"
  ON trust_states FOR UPDATE
  USING (true);

-- Políticas para qr_verifications
CREATE POLICY "Producers can view own lot verifications"
  ON qr_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lots
      WHERE lots.id = qr_verifications.lot_id
        AND lots.producer_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create verifications"
  ON qr_verifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 14. VISTAS MATERIALIZADAS
-- ============================================

-- Vista: Lotes con conteo de verificaciones
CREATE MATERIALIZED VIEW lot_verification_counts AS
SELECT
  l.id,
  l.lot_id,
  l.origin_location,
  p.full_name as producer_name,
  COUNT(qr.id) as verification_count,
  MAX(qr.verified_at) as last_verified_at
FROM lots l
LEFT JOIN profiles p ON l.producer_id = p.id
LEFT JOIN qr_verifications qr ON l.id = qr.lot_id
GROUP BY l.id, l.lot_id, l.origin_location, p.full_name;

CREATE UNIQUE INDEX idx_lot_verif_counts_id ON lot_verification_counts(id);
CREATE INDEX idx_lot_verif_counts_lot_id ON lot_verification_counts(lot_id);

COMMENT ON MATERIALIZED VIEW lot_verification_counts IS 'Conteo de verificaciones por lote (refrescar cada hora)';

-- Vista: Estadísticas de productores
CREATE MATERIALIZED VIEW producer_statistics AS
SELECT
  p.id as producer_id,
  p.full_name,
  p.location,
  COUNT(l.id) as total_lots,
  AVG(ts.trust_score) as avg_trust_score,
  SUM(ts.verification_count) as total_verifications
FROM profiles p
LEFT JOIN lots l ON p.id = l.producer_id
LEFT JOIN trust_states ts ON l.id = ts.lot_id
WHERE p.role = 'agricultor'
GROUP BY p.id, p.full_name, p.location;

CREATE UNIQUE INDEX idx_producer_stats_id ON producer_statistics(producer_id);

COMMENT ON MATERIALIZED VIEW producer_statistics IS 'Estadísticas agregadas por productor';

-- ============================================
-- FIN DE MIGRATION
-- ============================================

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Core Schema V2 creado exitosamente';
  RAISE NOTICE 'Tablas: lots, lot_attributes, lot_events, trust_states, qr_verifications';
  RAISE NOTICE 'Funciones: create_lot_complete, get_lot_timeline, get_lot_with_details';
  RAISE NOTICE 'Triggers: auto updated_at, eventos iniciales, trust_state automático';
  RAISE NOTICE 'RLS habilitado en todas las tablas';
END $$;
