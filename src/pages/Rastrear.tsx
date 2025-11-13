import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Timeline from "@/components/Timeline";
import { toast } from "sonner";

const Rastrear = () => {
  const [searchParams] = useSearchParams();
  const [loteId, setLoteId] = useState(searchParams.get("lote") || "");
  const [loteData, setLoteData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const initialLote = searchParams.get("lote");
    if (initialLote) {
      handleSearch(initialLote);
    }
  }, []);

  const handleSearch = async (searchId?: string) => {
    const searchValue = searchId || loteId;
    
    if (!searchValue) {
      toast.error("Por favor ingresa un ID de lote");
      return;
    }

    setIsSearching(true);

    // Simular búsqueda en blockchain
    setTimeout(() => {
      const lotes = JSON.parse(localStorage.getItem("lotes") || "[]");
      const lote = lotes.find((l: any) => l.loteId === searchValue);

      if (lote) {
        const timelineData = {
          loteId: lote.loteId,
          productor: lote.productor,
          ubicacion: lote.ubicacion,
          calidad: lote.calidad,
          hash: lote.hash,
          steps: [
            {
              id: "1",
              title: "Productor - Piura",
              description: `Registrado por ${lote.productor}`,
              date: new Date(lote.timestamp).toLocaleDateString("es-PE"),
              completed: true,
            },
            {
              id: "2",
              title: "Exportador",
              description: "En proceso de exportación",
              date: new Date(Date.now() + 86400000).toLocaleDateString("es-PE"),
              completed: false,
              current: true,
            },
            {
              id: "3",
              title: "Supermercado - Lima",
              description: "En distribución",
              completed: false,
            },
            {
              id: "4",
              title: "Cliente Final",
              description: "Entregado al consumidor",
              completed: false,
            },
          ],
        };
        setLoteData(timelineData);
        toast.success("Lote encontrado");
      } else {
        toast.error("Lote no encontrado. Intenta con MG-2024-001");
        setLoteData(null);
      }

      setIsSearching(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Rastrear Lote</h1>
            <p className="text-muted-foreground">
              Busca tu lote de mangos y visualiza su trazabilidad completa
            </p>
          </div>

          {/* Search Card */}
          <Card className="shadow-soft mb-8">
            <CardHeader>
              <CardTitle>Buscar por ID de Lote</CardTitle>
              <CardDescription>
                Ingresa el código único de tu lote de mangos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="search">ID del Lote</Label>
                  <Input
                    id="search"
                    placeholder="Ej: MG-2024-001"
                    value={loteId}
                    onChange={(e) => setLoteId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => handleSearch()}
                    className="bg-gradient-primary hover:opacity-90"
                    disabled={isSearching}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {loteData && (
            <div className="space-y-6">
              {/* Lote Info */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Información del Lote</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ID del Lote</p>
                    <p className="font-semibold">{loteData.loteId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Productor</p>
                    <p className="font-semibold">{loteData.productor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ubicación</p>
                    <p className="font-semibold">{loteData.ubicacion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Calidad</p>
                    <p className="font-semibold">{loteData.calidad}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Hash de Transacción</p>
                    <p className="font-mono text-xs break-all">{loteData.hash}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Cadena de Suministro</CardTitle>
                  <CardDescription>
                    Seguimiento del lote desde su origen hasta el consumidor final
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Timeline steps={loteData.steps} />
                </CardContent>
              </Card>
            </div>
          )}

          {!loteData && !isSearching && (
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingresa un ID de lote para comenzar el rastreo</p>
                <p className="text-sm mt-2">Prueba con: MG-2024-001</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rastrear;
