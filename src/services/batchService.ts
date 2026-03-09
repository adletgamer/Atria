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
  metadata?: Record<string, any>;
  total_kg?: number;
  price_per_kg?: number;
  is_listed?: boolean;
}

/**
 * Saves a batch to the database, linking it to the authenticated user.
 */
export const saveBatchToDatabase = async (batchData: BatchRecord) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("batches")
      .insert([{
        batch_id: batchData.batch_id,
        producer_name: batchData.producer_name,
        producer_id: user?.id || null,
        location: batchData.location,
        variety: batchData.variety,
        quality: batchData.quality,
        transaction_hash: batchData.transaction_hash,
        wallet_address: batchData.wallet_address || null,
        metadata: batchData.metadata || {},
        total_kg: batchData.total_kg || null,
        price_per_kg: batchData.price_per_kg || null,
        is_listed: batchData.is_listed ?? false,
      }])
      .select();

    if (error) {
      console.error("Error saving batch:", error);
      toast.error(`Error: ${error.message}`);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Exception saving batch:", error);
    toast.error("Error al guardar el lote");
    return { success: false, error };
  }
};

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
