// ============================================
// EJEMPLOS COMPLETOS DE USO
// ============================================

/**
 * EJEMPLO 1: Registrar un nuevo lote
 */
async function ejemploRegistrarLote() {
  import { saveBatchToDatabase } from "@/services/batchService";
  import { toast } from "sonner";

  // Datos del lote
  const batchData = {
    batch_id: "LOTE-2025-001",
    producer_name: "Juan Pérez García",
    location: "Piura, Perú",
    variety: "Kent",
    quality: "Premium",
    transaction_hash: "0x1234567890abcdef1234567890abcdef12345678",
    wallet_address: "0xabcdef1234567890abcdef1234567890abcdef12",
    metadata: {
      varietyId: "kent",
      emoji: "🥭",
      timestamp: new Date().toISOString(),
      network: "Polygon Amoy",
      peso: "50 kg",
      temperatura: "18°C"
    }
  };

  // Guardar en BD
  const result = await saveBatchToDatabase(batchData);

  if (result.success) {
    console.log("✓ Lote guardado exitosamente");
    toast.success("Lote registrado en la BD");
  } else {
    console.error("✗ Error al guardar:", result.error);
    toast.error("Error al registrar el lote");
  }
}

/**
 * EJEMPLO 2: Leer todos los lotes
 */
async function ejemploLeerTodosLosLotes() {
  import { getAllBatches } from "@/services/batchService";

  const result = await getAllBatches();

  if (result.success) {
    console.log("Total de lotes:", result.data.length);
    
    result.data.forEach((batch) => {
      console.log(`
        ID: ${batch.batch_id}
        Productor: ${batch.producer_name}
        Ubicación: ${batch.location}
        Variedad: ${batch.variety}
        Calidad: ${batch.quality}
        Fecha: ${batch.created_at}
      `);
    });
  }
}

/**
 * EJEMPLO 3: Buscar un lote específico
 */
async function ejemploBuscarLote(batchId: string) {
  import { getBatchById } from "@/services/batchService";

  const result = await getBatchById(batchId);

  if (result.success && result.data) {
    console.log("Lote encontrado:");
    console.log(result.data);
    
    // Acceder a los datos
    const batch = result.data;
    console.log(`
      Productor: ${batch.producer_name}
      Hash TX: ${batch.transaction_hash}
      Metadata: ${JSON.stringify(batch.metadata, null, 2)}
    `);
  } else {
    console.log("Lote no encontrado");
  }
}

/**
 * EJEMPLO 4: Usar el componente QRGenerator mejorado
 */
function EjemploComponenteQR() {
  import QRGenerator from "@/components/QRGenerator";
  import type { QRDataExport } from "@/components/QRGenerator";

  const [qrData, setQrData] = useState<QRDataExport | null>(null);

  const handleQRDataChange = (data: QRDataExport) => {
    console.log("Datos del QR:", data);
    setQrData(data);
    
    // Guardar logs de datos del QR para auditoría
    localStorage.setItem(`qr-data-${data.batchId}`, JSON.stringify(data));
  };

  return (
    <div className="space-y-4">
      {/* QR Básico */}
      <QRGenerator
        batchId="LOTE-2025-001"
        size={200}
        showDownload={true}
        showCopy={true}
        showShare={true}
      />

      {/* QR con Colores Personalizados */}
      <QRGenerator
        batchId="LOTE-2025-002"
        size={250}
        bgColor="#ffffff"
        fgColor="#ff6b35" // Naranja MangoChain
        onDataChange={handleQRDataChange}
      />

      {/* QR en Dashboard */}
      <QRGenerator
        batchId="LOTE-2025-003"
        size={150}
        showDownload={false}
        showCopy={true}
        showShare={false}
      />

      {/* Mostrar datos capturados */}
      {qrData && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3>Datos del QR Capturados:</h3>
          <pre>{JSON.stringify(qrData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

/**
 * EJEMPLO 5: Flujo Completo - Registrar y Mostrar QR
 */
async function ejemploFlujoCompleto(formData: {
  loteId: string;
  productor: string;
  ubicacion: string;
  variedad: string;
  calidad: string;
  wallet: string;
}) {
  import { saveBatchToDatabase } from "@/services/batchService";
  import QRGenerator from "@/components/QRGenerator";

  try {
    // 1. Preparar datos
    const transactionHash = `0x${Math.random().toString(16).substring(2, 42)}`;
    
    const batchData = {
      batch_id: formData.loteId,
      producer_name: formData.productor,
      location: formData.ubicacion,
      variety: formData.variedad,
      quality: formData.calidad,
      transaction_hash: transactionHash,
      wallet_address: formData.wallet,
      metadata: {
        timestamp: new Date().toISOString(),
        network: "Polygon Amoy"
      }
    };

    // 2. Guardar en BD
    const result = await saveBatchToDatabase(batchData);

    if (!result.success) {
      throw new Error("No se pudo guardar en la BD");
    }

    // 3. Mostrar QR
    return (
      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-green-800 font-bold">
            ✓ Lote registrado exitosamente
          </p>
          <p className="text-sm text-green-700">
            Hash: {transactionHash.slice(0, 20)}...
          </p>
        </div>

        <QRGenerator
          batchId={formData.loteId}
          size={250}
          showDownload={true}
          showCopy={true}
          showShare={true}
          bgColor="#ffffff"
          fgColor="#ff6b35"
        />
      </div>
    );

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

/**
 * EJEMPLO 6: Verificar Conexión a Supabase
 */
async function verificarConexionSupabase() {
  import { testSupabaseConnection } from "@/services/batchService";

  const result = await testSupabaseConnection();

  if (result.connected) {
    console.log("✓ Conectado a Supabase");
    console.log(result.message);
  } else {
    console.error("✗ Error de conexión:");
    console.error(result.error);
  }
}

/**
 * EJEMPLO 7: Hook Personalizado para Usar en Componentes
 */
import { useState, useEffect } from "react";
import { getAllBatches } from "@/services/batchService";

function useBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const result = await getAllBatches();
      if (result.success) {
        setBatches(result.data);
      } else {
        setError("Error al cargar los lotes");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return { batches, loading, error, reload: loadBatches };
}

// Usar el hook
function ComponenteConBatches() {
  const { batches, loading, error, reload } = useBatches();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Lotes Registrados ({batches.length})</h2>
      <button onClick={reload}>Recargar</button>
      <ul>
        {batches.map((batch) => (
          <li key={batch.batch_id}>
            {batch.producer_name} - {batch.variety}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * EJEMPLO 8: Descargar QR desde JavaScript
 */
function descargarQRDirecto(batchId: string, formato: "png" | "svg") {
  const svg = document.getElementById(`qr-${batchId}`) as HTMLElement;
  if (!svg) {
    console.error("No se encontró el QR");
    return;
  }

  const svgData = new XMLSerializer().serializeToString(svg);

  if (formato === "svg") {
    // Descargar como SVG
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `qr-${batchId}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  } else if (formato === "png") {
    // Descargar como PNG
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    canvas.width = 240;
    canvas.height = 240;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20, 200, 200);
        
        const pngFile = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `qr-${batchId}.png`;
        link.href = pngFile;
        link.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }
}

/**
 * EJEMPLO 9: Exportar Datos de Batches a CSV
 */
async function exportarBatchesACSV() {
  import { getAllBatches } from "@/services/batchService";

  const result = await getAllBatches();
  
  if (!result.success || result.data.length === 0) {
    console.log("No hay lotes para exportar");
    return;
  }

  // Crear CSV
  const headers = ["batch_id", "producer_name", "location", "variety", "quality", "created_at"];
  const rows = result.data.map(batch => [
    batch.batch_id,
    batch.producer_name,
    batch.location,
    batch.variety,
    batch.quality,
    batch.created_at
  ]);

  const csv = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  // Descargar
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `batches-${new Date().toISOString()}.csv`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * EJEMPLO 10: Integración con React Query (Opcional)
 */
import { useQuery, useMutation } from "@tanstack/react-query";
import { saveBatchToDatabase, getAllBatches } from "@/services/batchService";

// Query para obtener todos los batches
const useBatchesQuery = () => {
  return useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const result = await getAllBatches();
      return result.data || [];
    }
  });
};

// Mutation para guardar un batch
const useSaveBatchMutation = () => {
  return useMutation({
    mutationFn: saveBatchToDatabase,
    onSuccess: (result) => {
      console.log("Batch guardado:", result.data);
      // Invalidar cache
      // queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
    onError: (error) => {
      console.error("Error guardando batch:", error);
    }
  });
};

// Usar en componente
function ComponenteConReactQuery() {
  const { data: batches, isLoading } = useBatchesQuery();
  const { mutate: saveBatch } = useSaveBatchMutation();

  return (
    <div>
      {isLoading ? "Cargando..." : `${batches?.length} lotes`}
      <button onClick={() => saveBatch({...batchData})}>
        Guardar
      </button>
    </div>
  );
}

// ============================================
// FIN DE EJEMPLOS
// ============================================

export {
  ejemploRegistrarLote,
  ejemploLeerTodosLosLotes,
  ejemploBuscarLote,
  EjemploComponenteQR,
  verificarConexionSupabase,
  useBatches,
  descargarQRDirecto,
  exportarBatchesACSV
};
