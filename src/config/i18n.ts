/**
 * Internacionalización (i18n) - Traducciones
 * Estructura escalable para soportar múltiples idiomas
 */

export const translations = {
  es: {
    // Registrar página
    registrar: {
      title: 'Registrar Lote',
      subtitle: 'Registra tu lote de mangos en la blockchain',
      formTitle: 'Formulario de Registro de Lote',
      formDescription: 'Completa todos los campos para registrar tu lote en la blockchain',
      
      // Form fields
      batchId: 'ID del Lote',
      batchIdPlaceholder: 'Ejemplo: MG-2024-001',
      producerName: 'Nombre del Productor',
      producerNamePlaceholder: 'Nombre del productor',
      location: 'Ubicación',
      variety: 'Variedad de Mango',
      varietyPlaceholder: 'Selecciona una variedad',
      qualityGrade: 'Grado de Calidad',
      qualityPlaceholder: 'Selecciona calidad',
      
      // Quality grades
      premium: 'Premium',
      export: 'Exportación',
      firstGrade: 'Primera Clase',
      secondGrade: 'Segunda Clase',
      
      // Locations
      piura: 'Piura',
      lambayeque: 'Lambayeque',
      ica: 'Ica',
      
      // Buttons
      connectWallet: 'Conectar Wallet',
      register: 'Registrar en Polygon Amoy',
      trackBatch: 'Rastrear Lote',
      registerAnother: 'Registrar Otro',
      registering: 'Registrando en Blockchain...',
      
      // Messages
      walletNotConnected: 'Wallet No Conectada',
      connectWalletMessage: 'Conecta tu wallet de MetaMask para registrar lotes en Polygon Amoy Testnet',
      requiredNetwork: 'Red Requerida: Polygon Amoy Testnet (Chain ID: 80002)',
      completeFields: 'Por favor completa todos los campos',
      registrationSuccess: '¡Registro Exitoso!',
      batchRegistered: 'Tu lote ha sido registrado en la blockchain',
      
      // Warnings
      note: 'Nota',
      noteMessage: 'Al registrar, una transacción será simulada en Polygon Amoy Testnet. Asegúrate de tener MATIC de prueba en tu wallet.',
      network: 'Red',
      
      // Connected state
      walletConnected: 'Wallet Conectada',
      polygonAmoy: 'Polygon Amoy',
      chainId: 'Chain ID',
      
      // Validation
      selectVariety: 'Por favor selecciona una variedad de mango',
      varietyRequired: 'La variedad es obligatoria',
    },
    
    // Mango varieties (names and descriptions)
    varieties: {
      'tommy-atkins': {
        name: 'Tommy Atkins',
        description: 'Variedad mejorada de exportación, piel roja-amarilla, pulpa amarilla',
      },
      'haden': {
        name: 'Haden',
        description: 'Mango rojo oscuro, sabor dulce, de exportación',
      },
      'pico-de-pajaro': {
        name: 'Pico de Pájaro',
        description: 'Mango pequeño, muy dulce, típico de Piura',
      },
      'kent': {
        name: 'Kent',
        description: 'Variedad de exportación, piel verde-amarilla con puntos rojos',
      },
      'ataulfo': {
        name: 'Ataulfo',
        description: 'Mango pequeño dorado, muy dulce, de exportación premium',
      },
      'edward': {
        name: 'Edward',
        description: 'Mango de exportación, piel roja-amarilla, fibra mínima',
      },
      'criollo': {
        name: 'Criollo',
        description: 'Mango local peruano, uso local y regional',
      },
      'francis': {
        name: 'Francis',
        description: 'Variedad de exportación, tamaño mediano, muy dulce',
      },
    },
  },
  
  en: {
    // Registrar página
    registrar: {
      title: 'Register Batch',
      subtitle: 'Register your mango batch on the blockchain',
      formTitle: 'Batch Registration Form',
      formDescription: 'Complete all fields to register your batch on the blockchain',
      
      // Form fields
      batchId: 'Batch ID',
      batchIdPlaceholder: 'Example: MG-2024-001',
      producerName: 'Producer Name',
      producerNamePlaceholder: 'Producer name',
      location: 'Location',
      variety: 'Mango Variety',
      varietyPlaceholder: 'Select a variety',
      qualityGrade: 'Quality Grade',
      qualityPlaceholder: 'Select quality',
      
      // Quality grades
      premium: 'Premium',
      export: 'Export',
      firstGrade: 'First Grade',
      secondGrade: 'Second Grade',
      
      // Locations
      piura: 'Piura',
      lambayeque: 'Lambayeque',
      ica: 'Ica',
      
      // Buttons
      connectWallet: 'Connect Wallet',
      register: 'Register on Polygon Amoy',
      trackBatch: 'Track Batch',
      registerAnother: 'Register Another',
      registering: 'Registering on Blockchain...',
      
      // Messages
      walletNotConnected: 'Wallet Not Connected',
      connectWalletMessage: 'Connect your MetaMask wallet to register batches on Polygon Amoy Testnet',
      requiredNetwork: 'Required Network: Polygon Amoy Testnet (Chain ID: 80002)',
      completeFields: 'Please complete all fields',
      registrationSuccess: 'Registration Successful!',
      batchRegistered: 'Your batch has been registered on the blockchain',
      
      // Warnings
      note: 'Note',
      noteMessage: 'When registering, a transaction will be simulated on Polygon Amoy Testnet. Make sure you have test MATIC in your wallet.',
      network: 'Network',
      
      // Connected state
      walletConnected: 'Wallet Connected',
      polygonAmoy: 'Polygon Amoy',
      chainId: 'Chain ID',
      
      // Validation
      selectVariety: 'Please select a mango variety',
      varietyRequired: 'Variety is required',
    },
    
    // Mango varieties (names and descriptions)
    varieties: {
      'tommy-atkins': {
        name: 'Tommy Atkins',
        description: 'Improved export variety, red-yellow skin, yellow pulp',
      },
      'haden': {
        name: 'Haden',
        description: 'Dark red mango, sweet taste, for export',
      },
      'pico-de-pajaro': {
        name: 'Bird\'s Beak',
        description: 'Small mango, very sweet, typical of Piura',
      },
      'kent': {
        name: 'Kent',
        description: 'Export variety, green-yellow skin with red spots',
      },
      'ataulfo': {
        name: 'Ataulfo',
        description: 'Small golden mango, very sweet, premium export',
      },
      'edward': {
        name: 'Edward',
        description: 'Export mango, red-yellow skin, minimum fiber',
      },
      'criollo': {
        name: 'Criollo',
        description: 'Local Peruvian mango, local and regional use',
      },
      'francis': {
        name: 'Francis',
        description: 'Export variety, medium size, very sweet',
      },
    },
  },
} as const;

/**
 * Hook helper para obtener traducciones (useTranslation simulado)
 */
export const useTranslation = (language: 'es' | 'en' = 'es') => {
  return translations[language];
};

/**
 * Función helper para obtener una traducción específica
 */
export const t = (key: string, language: 'es' | 'en' = 'es'): string => {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return typeof value === 'string' ? value : key;
};
