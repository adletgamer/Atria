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
 * NOTE: The 'batches' table must be created first via migration
 */
export const saveBatchToDatabase = async (batchData: BatchRecord) => {
  try {
    const { data, error } = await (supabase as any)
      .from("batches")
      .insert([{
        batch_id: batchData.batch_id,
        producer_name: batchData.producer_name,
        location: batchData.location,
        variety: batchData.variety,
        quality: batchData.quality,
        transaction_hash: batchData.transaction_hash,
        wallet_address: batchData.wallet_address || null,
        metadata: batchData.metadata || {},
      }])
      .select();

    if (error) {
      console.error("Error saving batch:", error);
      toast.error(`Error guardando lote: ${error.message}`);
      return { success: false, error };
    }

    toast.success("Lote guardado en la base de datos ✓");
    return { success: true, data };
  } catch (error) {
    console.error("Exception saving batch:", error);
    toast.error("Error al guardar el lote en la BD");
    return { success: false, error };
  }
};

export const getAllBatches = async () => {
  try {
    const { data, error } = await (supabase as any)
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

export const getBatchById = async (batchId: string) => {
  try {
    const { data, error } = await (supabase as any)
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

export const testSupabaseConnection = async () => {
  try {
    const { error } = await (supabase as any)
      .from("batches")
      .select("count", { count: "exact" })
      .limit(0);

    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true, message: "Conectado correctamente" };
  } catch (error) {
    return { connected: false, error: String(error) };
  }
};
