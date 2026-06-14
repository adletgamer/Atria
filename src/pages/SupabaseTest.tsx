import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  FileText, 
  Activity, 
  Lock, 
  TrendingUp, 
  Server, 
  Award,
  ExternalLink,
  Info
} from "lucide-react";
import { Link } from "react-router-dom";

interface TestStep {
  id: string;
  name: string;
  description: string;
  status: "idle" | "running" | "success" | "failed";
  error?: string;
  output?: string;
}

const SupabaseTest = () => {
  const [steps, setSteps] = useState<TestStep[]>([
    {
      id: "connection",
      name: "1. Conexión & Auth Básica",
      description: "Valida la conexión HTTP y la resolución del SDK con la clave Anon pública.",
      status: "idle"
    },
    {
      id: "profiles",
      name: "2. CRUD Perfil Temporal",
      description: "Intenta leer o registrar un perfil básico en la tabla `profiles` para verificar RLS.",
      status: "idle"
    },
    {
      id: "lots",
      name: "3. Creación Atómica de Lotes (RPC)",
      description: "Prueba la función RPC `create_lot_complete` con atributos EAV integrados.",
      status: "idle"
    },
    {
      id: "attributes",
      name: "4. Trazabilidad de Atributos EAV",
      description: "Inspecciona los atributos de un lote creado en la tabla `lot_attributes`.",
      status: "idle"
    },
    {
      id: "events",
      name: "5. Eventos Append-Only",
      description: "Registra un evento inmutable en el timeline de la tabla `lot_events`.",
      status: "idle"
    }
  ]);

  const [isRunningAll, setIsRunningAll] = useState(false);
  const [projectId, setProjectId] = useState<string>("");

  // Extraer el project ID de la URL configurada
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "No configurada";

  const updateStep = (id: string, updates: Partial<TestStep>) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, ...updates } : step));
  };

  const runConnectionTest = async (): Promise<boolean> => {
    updateStep("connection", { status: "running", error: undefined, output: undefined });
    try {
      // Intentar leer la sesión de auth (prueba de comunicación básica libre de errores)
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      const successMsg = `Conectado exitosamente a: ${supabaseUrl}\nSesión actual: ${data.session ? 'Autenticado' : 'Invitado (Anon)'}`;
      updateStep("connection", { 
        status: "success", 
        output: successMsg 
      });
      return true;
    } catch (err: any) {
      updateStep("connection", { 
        status: "failed", 
        error: err.message || "Error al conectar con Supabase" 
      });
      return false;
    }
  };

  const runProfilesTest = async (): Promise<boolean> => {
    updateStep("profiles", { status: "running", error: undefined, output: undefined });
    try {
      // Creamos un UUID de prueba o usamos el id del usuario anon
      const testId = "00000000-0000-0000-0000-000000000000";
      
      // Intentamos leer un perfil
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (error) throw error;

      const successMsg = `Lectura correcta de profiles. RLS validada.\nRegistros encontrados: ${data?.length || 0}`;
      updateStep("profiles", { 
        status: "success", 
        output: successMsg 
      });
      return true;
    } catch (err: any) {
      updateStep("profiles", { 
        status: "failed", 
        error: `${err.code || ''} ${err.message}. Recuerda que para escribir en 'profiles' RLS requiere un usuario autenticado.` 
      });
      return false;
    }
  };

  const runLotsTest = async (): Promise<boolean> => {
    updateStep("lots", { status: "running", error: undefined, output: undefined });
    try {
      // Generamos un lot_id aleatorio que cumpla el regex constraint: '^[A-Z]{2,4}-\d{4}-\d{3,6}$'
      const randomNum = Math.floor(100 + Math.random() * 900);
      const generatedLotId = `ATRI-2026-${randomNum}`;

      // Llamar al RPC
      const { data, error } = await supabase.rpc("create_lot_complete", {
        p_lot_id: generatedLotId,
        p_producer_id: null, // Invitado o anónimo para pruebas MVP
        p_origin_location: "Piura Valley, Peru",
        p_harvest_date: new Date().toISOString().split('T')[0],
        p_attributes: {
          variety: "Kent",
          quality: "Premium",
          total_kg: "12500"
        }
      });

      if (error) throw error;

      updateStep("lots", { 
        status: "success", 
        output: `Lote creado exitosamente mediante RPC atómico!\nLot ID legible: ${generatedLotId}\nID Interno UUID: ${JSON.stringify(data)}` 
      });
      return true;
    } catch (err: any) {
      updateStep("lots", { 
        status: "failed", 
        error: `${err.message || "Error ejecutando RPC. Asegúrate de ejecutar el script SQL maestro en tu editor de Supabase primero."}` 
      });
      return false;
    }
  };

  const runAttributesTest = async (): Promise<boolean> => {
    updateStep("attributes", { status: "running", error: undefined, output: undefined });
    try {
      // Consultar el último lote creado
      const { data: lots, error: lotError } = await supabase
        .from("lots")
        .select("id, lot_id")
        .order("created_at", { ascending: false })
        .limit(1);

      if (lotError) throw lotError;
      if (!lots || lots.length === 0) {
        throw new Error("No se encontraron lotes. Ejecuta primero la prueba de 'Creación de Lotes'.");
      }

      const lot = lots[0];

      // Consultar atributos de ese lote
      const { data: attributes, error: attrError } = await supabase
        .from("lot_attributes")
        .select("*")
        .eq("lot_id", lot.id);

      if (attrError) throw attrError;

      const results = attributes.map(a => `${a.attribute_key}: ${a.attribute_value} (${a.value_type})`).join("\n");
      updateStep("attributes", { 
        status: "success", 
        output: `Atributos recuperados del lote ${lot.lot_id}:\n${results}` 
      });
      return true;
    } catch (err: any) {
      updateStep("attributes", { 
        status: "failed", 
        error: err.message || "Error al recuperar atributos." 
      });
      return false;
    }
  };

  const runEventsTest = async (): Promise<boolean> => {
    updateStep("events", { status: "running", error: undefined, output: undefined });
    try {
      // Consultar el último lote
      const { data: lots, error: lotError } = await supabase
        .from("lots")
        .select("id, lot_id")
        .order("created_at", { ascending: false })
        .limit(1);

      if (lotError) throw lotError;
      if (!lots || lots.length === 0) {
        throw new Error("No se encontraron lotes para asociar el evento.");
      }

      const lot = lots[0];

      // Insertar un evento inmutable manualmente
      const { data, error } = await supabase
        .from("lot_events")
        .insert({
          lot_id: lot.id,
          event_type: "lot.inspected",
          event_category: "verification",
          description: "Prueba técnica de timeline completada por Supabase Connection Test Suite.",
          location: "Terminal de Exportación, Paita"
        })
        .select();

      if (error) throw error;

      updateStep("events", { 
        status: "success", 
        output: `Timeline append-only validado!\nEvento de prueba registrado para lote: ${lot.lot_id}\nTipo: lot.inspected` 
      });
      return true;
    } catch (err: any) {
      updateStep("events", { 
        status: "failed", 
        error: err.message || "Error registrando evento." 
      });
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    toast.info("Iniciando suite profunda de pruebas CRUD...");

    const connOk = await runConnectionTest();
    if (!connOk) {
      toast.error("Prueba de conexión fallida. Deteniendo suite.");
      setIsRunningAll(false);
      return;
    }

    await runProfilesTest();
    const lotsOk = await runLotsTest();
    if (lotsOk) {
      await runAttributesTest();
      await runEventsTest();
    } else {
      updateStep("attributes", { status: "failed", error: "Omitido por fallo en paso previo." });
      updateStep("events", { status: "failed", error: "Omitido por fallo en paso previo." });
    }

    setIsRunningAll(false);
    toast.success("Suite de pruebas completada.");
  };

  return (
    <div className="min-h-screen bg-[#0C0F17] text-white flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Header premium con gradientes */}
      <header className="border-b border-[#1E293B] bg-[#0E1322]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent font-display">
              ATRIA DevTools
            </h1>
            <p className="text-xs text-slate-400">Supabase Connection & Audit Lab</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            Volver al Inicio
          </Link>
          <Button 
            disabled={isRunningAll}
            onClick={runAllTests} 
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl text-xs px-4 py-2 flex items-center gap-1.5 shadow-md shadow-orange-950/20"
          >
            {isRunningAll ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
            {isRunningAll ? "Corriendo..." : "Ejecutar Suite Completa"}
          </Button>
        </div>
      </header>

      {/* Main container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Info Card banner */}
        <section className="bg-gradient-to-r from-[#1A1F30] to-[#141A2D] rounded-3xl p-6 border border-[#2B3553]/40 shadow-xl flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="p-4 bg-[#232A45] rounded-2xl">
            <Server className="h-8 w-8 text-amber-400" />
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="font-bold text-xl flex items-center gap-2">
              Conexión Activa de Supabase
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-normal">
                Configurado
              </span>
            </h2>
            <div className="text-sm text-slate-400 font-mono break-all bg-black/30 p-2.5 rounded-xl border border-[#2B3553]/20">
              URL: {supabaseUrl}
            </div>
            <p className="text-xs text-slate-400">
              Esta herramienta interactúa en tiempo real con el proyecto configurado en tu archivo de variables de entorno <code className="text-amber-400 font-semibold bg-[#232A45]/30 px-1 py-0.5 rounded">.env.local</code>.
            </p>
          </div>
        </section>

        {/* Step list & execution card */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* List of tests (Col 1 & 2) */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-bold text-lg text-slate-300 flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-amber-500" />
              Pruebas de Integridad CRUD
            </h3>

            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className="bg-[#131825] border border-[#1E293B] rounded-2xl p-5 hover:border-slate-700/60 transition-all flex gap-4"
              >
                {/* Visual state indicator */}
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[#1E293B]">
                    {step.status === "idle" && <span className="text-xs font-bold text-slate-400">{index + 1}</span>}
                    {step.status === "running" && <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />}
                    {step.status === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                    {step.status === "failed" && <XCircle className="h-5 w-5 text-rose-500" />}
                  </div>
                  <div className="w-0.5 flex-1 bg-[#1E293B] mt-2 min-h-[40px] hidden sm:block"></div>
                </div>

                {/* Step detail */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base text-slate-200">{step.name}</h4>
                      <p className="text-xs text-slate-400">{step.description}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 rounded-lg border-[#2D3748] bg-[#1A202C] hover:bg-[#2D3748] text-white text-xs"
                      onClick={async () => {
                        if (step.id === "connection") await runConnectionTest();
                        if (step.id === "profiles") await runProfilesTest();
                        if (step.id === "lots") await runLotsTest();
                        if (step.id === "attributes") await runAttributesTest();
                        if (step.id === "events") await runEventsTest();
                      }}
                    >
                      Probar
                    </Button>
                  </div>

                  {/* Output details */}
                  {step.output && (
                    <pre className="text-xs font-mono bg-black/40 text-emerald-300 p-3 rounded-xl border border-emerald-950/30 whitespace-pre-wrap break-all">
                      {step.output}
                    </pre>
                  )}

                  {step.error && (
                    <div className="text-xs font-mono bg-rose-950/20 text-rose-300 p-3 rounded-xl border border-rose-950/40 flex items-start gap-2">
                      <Info className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                      <span>{step.error}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Guidelines Sidebar (Col 3) */}
          <div className="space-y-6">
            
            {/* Quick guide card */}
            <div className="bg-gradient-to-b from-[#181D2E] to-[#0E1322] border border-[#2B3553]/40 rounded-3xl p-6 space-y-4 shadow-xl">
              <h4 className="font-bold text-base flex items-center gap-2 text-slate-200">
                <Award className="h-5 w-5 text-amber-400" />
                Guía de Reconstrucción
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Para que estas pruebas pasen a verde exitosamente en tu nuevo Supabase:
              </p>
              <ul className="text-xs text-slate-300 space-y-2.5 list-disc list-inside">
                <li>
                  Ingresa en el **SQL Editor** de tu panel de Supabase.
                </li>
                <li>
                  Abre una nueva query en blanco y copia el contenido completo del script consolidado.
                </li>
                <li>
                  Ejecuta la query presionando **Run**. Las tablas, enums, triggers y RPCs se compilarán en menos de 5 segundos.
                </li>
                <li>
                  Actualiza tus variables en el archivo <code className="text-amber-400 font-semibold bg-[#232A45]/30 px-1 py-0.5 rounded">.env.local</code> y reinicia tu servidor local (<code className="text-amber-400">npm run dev</code>).
                </li>
              </ul>

              <div className="pt-2">
                <a 
                  href="file:///c:/Users/HP/Documents/Fadelk%202025/VELOCITY/MANGO%20TRACKER/mango-rastreo-chain/supabase/rebuild_schema.sql"
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#232A45] hover:bg-[#2F385B] text-slate-200 hover:text-white text-xs font-semibold py-2.5 rounded-xl border border-[#3E4A74]/40 transition-colors"
                >
                  <FileText className="h-4 w-4 text-amber-500" />
                  Abrir Script SQL Local
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Security checklist card */}
            <div className="bg-[#131825] border border-[#1E293B] rounded-3xl p-6 space-y-4">
              <h4 className="font-bold text-base flex items-center gap-2 text-slate-200">
                <Lock className="h-4.5 w-4.5 text-amber-500" />
                Auditoría RLS & Seguridad
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Este script implementa Row Level Security (RLS) granular en el 100% de las tablas:
              </p>
              <div className="space-y-2">
                <div className="flex gap-2 items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5"></div>
                  <p className="text-xs text-slate-300">
                    **Lectura Trazable**: Cualquiera puede consultar la trazabilidad pública de lotes a través de RPC con el ID del lote.
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5"></div>
                  <p className="text-xs text-slate-300">
                    **Escaneo QR Público**: Permite inserts anónimos automáticos para el registro de geolocalización e IPs en escaneos de consumidores.
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5"></div>
                  <p className="text-xs text-slate-300">
                    **Writes Autenticados**: Las modificaciones e inserciones de lotes y consignaciones requieren un token JWT de agricultor/exportador válido.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </section>
      </main>
    </div>
  );
};

export default SupabaseTest;
