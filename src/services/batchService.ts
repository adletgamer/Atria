import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BatchRecord {
  batch_id: string;
  producer_name: string;
  location: string;
  variety: string;
  quality: string;
  transaction_hash: string;
  wallet_address?: string;
  created_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Guarda un nuevo lote/batch en Supabase
 */
export const saveBatchToDatabase = async (batchData: BatchRecord) => {
  try {
    // Verificar conexión a Supabase
    const { data: connectionTest, error: connectionError } = await supabase
      .from("batches")
      .select("count", { count: "exact" })
      .limit(0);

    if (connectionError && connectionError.code !== "PGRST116") {
      console.warn("Supabase connection issue:", connectionError);
    }

    // Preparar datos para insertar
    const dataToInsert = {
      batch_id: batchData.batch_id,
      producer_name: batchData.producer_name,
      location: batchData.location,
      variety: batchData.variety,
      quality: batchData.quality,
      transaction_hash: batchData.transaction_hash,
      wallet_address: batchData.wallet_address || null,
      metadata: batchData.metadata || {},
    };

    // Insertar en la tabla batches
    const { data, error } = await supabase
      .from("batches")
      .insert([dataToInsert])
      .select();

    if (error) {
      console.error("Error saving batch to Supabase:", error);
      toast.error(`Error guardando lote: ${error.message}`);
      return { success: false, error };
    }

    console.log("Batch saved successfully:", data);
    toast.success("Lote guardado en la base de datos ✓");
    return { success: true, data };
  } catch (error) {
    console.error("Exception saving batch:", error);
    toast.error("Error al guardar el lote en la BD");
    return { success: false, error };
  }
};

/**
 * Obtiene todos los batches registrados
 */
export const getAllBatches = async () => {
  try {
    const { data, error } = await supabase
      .from("batches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching batches:", error);
      return { success: false, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Exception fetching batches:", error);
    return { success: false, data: [] };
  }
};

/**
 * Obtiene un batch específico por ID
 */
export const getBatchById = async (batchId: string) => {
  try {
    const { data, error } = await supabase
      .from("batches")
      .select("*")
      .eq("batch_id", batchId)
      .single();

    if (error) {
      console.error("Error fetching batch:", error);
      return { success: false, data: null };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Exception fetching batch:", error);
    return { success: false, data: null };
  }
};

/**
 * Verifica la conexión a Supabase
 */
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from("batches")
      .select("count", { count: "exact" })
      .limit(0);

    if (error) {
      console.error("Supabase connection error:", error);
      return { connected: false, error: error.message };
    }

    return { connected: true, message: "Conectado a Supabase correctamente" };
  } catch (error) {
    console.error("Exception testing connection:", error);
    return { connected: false, error: String(error) };
  }
};
