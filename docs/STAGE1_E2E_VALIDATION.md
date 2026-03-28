# Validación End-to-End - Stage 1

**Fecha:** 27 de marzo, 2026  
**Objetivo:** Validar flujo completo de creación de lote

---

## 🎯 Flujo de Prueba

```
1. /registrar → Crear lote (MG-2026-TEST-001)
2. Verificar en DB: lots, lot_attributes, lot_events, trust_states
3. /rastrear → Buscar lote
4. /verify → Verificar lote (registra QR)
5. /dashboard → Ver lote en stats
```

---

## ✅ Checklist de Validación

### Creación de Lote
- [ ] Formulario acepta datos
- [ ] Toast de éxito aparece
- [ ] QR code se genera

### Base de Datos
- [ ] `lots`: 1 row con lot_id='MG-2026-TEST-001'
- [ ] `lot_attributes`: 8 rows (variety, quality, total_kg, price_per_kg, is_listed, wallet_address, variety_id, emoji)
- [ ] `lot_events`: 1 row con event_type='lot.created'
- [ ] `trust_states`: 1 row con trust_score=10.00

### Rastrear
- [ ] Busca por lot_id y encuentra el lote
- [ ] Muestra información correcta
- [ ] Timeline se construye desde eventos

### Verify
- [ ] Encuentra el lote
- [ ] Registra verificación en `qr_verifications`
- [ ] `trust_states.trust_score` aumenta a 12.00 (+2.00)

### Dashboard
- [ ] totalBatches aumenta
- [ ] Lote aparece en "Lotes Recientes"
- [ ] Stats se actualizan correctamente

---

## 🔍 Queries de Validación

```sql
-- Verificar lote creado
SELECT * FROM lots WHERE lot_id = 'MG-2026-TEST-001';

-- Verificar atributos
SELECT attribute_key, attribute_value FROM lot_attributes 
WHERE lot_id = (SELECT id FROM lots WHERE lot_id = 'MG-2026-TEST-001')
ORDER BY attribute_key;

-- Verificar evento inicial
SELECT event_type, event_category FROM lot_events
WHERE lot_id = (SELECT id FROM lots WHERE lot_id = 'MG-2026-TEST-001');

-- Verificar trust_state inicial
SELECT trust_score, verification_count FROM trust_states
WHERE lot_id = (SELECT id FROM lots WHERE lot_id = 'MG-2026-TEST-001');

-- Verificar verificación QR
SELECT COUNT(*) as verification_count FROM qr_verifications
WHERE lot_id = (SELECT id FROM lots WHERE lot_id = 'MG-2026-TEST-001');

-- Verificar trust_score actualizado
SELECT trust_score FROM trust_states
WHERE lot_id = (SELECT id FROM lots WHERE lot_id = 'MG-2026-TEST-001');
```

---

## 📊 Resultados Esperados

| Tabla | Rows | Validación |
|-------|------|------------|
| lots | 1 | lot_id único |
| lot_attributes | 8 | Todos los atributos estándar |
| lot_events | 1+ | Evento inicial lot.created |
| trust_states | 1 | Score inicial 10.00 |
| qr_verifications | 1+ | Después de verify |

---

## ✨ Conclusión

Si todos los checks pasan, Stage 1 está validado correctamente.
