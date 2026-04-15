/**
 * Variedades de Mango Peruano
 * Datos de referencia para el formulario de registro
 */

export const MANGO_VARIETIES = {
  TOMMY_ATKINS: {
    id: 'tommy-atkins',
    name: 'Tommy Atkins',
    scientificName: 'Mangifera indica var. Tommy Atkins',
    description: 'Variedad mejorada de exportación, piel roja-amarilla, pulpa amarilla',
    exportable: true,
    color: 'from-red-500 to-amber-500',
    emoji: '🥭',
  },
  HADEN: {
    id: 'haden',
    name: 'Haden',
    scientificName: 'Mangifera indica var. Haden',
    description: 'Mango rojo oscuro, sabor dulce, de exportación',
    exportable: true,
    color: 'from-red-600 to-orange-600',
    emoji: '🥭',
  },
  PICO_DE_PAJARO: {
    id: 'pico-de-pajaro',
    name: 'Pico de Pájaro',
    scientificName: 'Mangifera indica var. Pico de Pájaro',
    description: 'Mango pequeño, muy dulce, típico de Piura',
    exportable: false,
    color: 'from-yellow-500 to-orange-400',
    emoji: '🐦',
  },
  KENT: {
    id: 'kent',
    name: 'Kent',
    scientificName: 'Mangifera indica var. Kent',
    description: 'Variedad de exportación, piel verde-amarilla con puntos rojos',
    exportable: true,
    color: 'from-green-500 to-yellow-500',
    emoji: '🌿',
  },
  ATAULFO: {
    id: 'ataulfo',
    name: 'Ataulfo',
    scientificName: 'Mangifera indica var. Ataulfo',
    description: 'Mango pequeño dorado, muy dulce, de exportación premium',
    exportable: true,
    color: 'from-yellow-400 to-amber-500',
    emoji: '✨',
  },
  EDWARD: {
    id: 'edward',
    name: 'Edward',
    scientificName: 'Mangifera indica var. Edward',
    description: 'Mango de exportación, piel roja-amarilla, fibra mínima',
    exportable: true,
    color: 'from-red-500 to-yellow-500',
    emoji: '🥭',
  },
  CRIOLLO: {
    id: 'criollo',
    name: 'Criollo',
    scientificName: 'Mangifera indica var. Criollo',
    description: 'Mango local peruano, uso local y regional',
    exportable: false,
    color: 'from-yellow-600 to-orange-500',
    emoji: '🌾',
  },
  FRANCIS: {
    id: 'francis',
    name: 'Francis',
    scientificName: 'Mangifera indica var. Francis',
    description: 'Variedad de exportación, tamaño mediano, muy dulce',
    exportable: true,
    color: 'from-orange-500 to-amber-600',
    emoji: '🥭',
  },
} as const;

/**
 * Array de variedades para mapeo en selects
 */
export const VARIETY_OPTIONS = Object.values(MANGO_VARIETIES).map((variety) => ({
  value: variety.id,
  label: variety.name,
  description: variety.description,
  emoji: variety.emoji,
  exportable: variety.exportable,
}));

/**
 * Helper para obtener información de una variedad por ID
 */
export const getVarietyById = (id: string) => {
  return Object.values(MANGO_VARIETIES).find((v) => v.id === id);
};

/**
 * Helper para obtener variedades exportables
 */
export const getExportableVarieties = () => {
  return VARIETY_OPTIONS.filter((v) => v.exportable);
};

/**
 * Helper para obtener variedades locales
 */
export const getLocalVarieties = () => {
  return VARIETY_OPTIONS.filter((v) => !v.exportable);
};
