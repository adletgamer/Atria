import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

const Registrar = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    loteId: "",
    productor: "",
    ubicacion: "Piura",
    calidad: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.loteId || !formData.productor || !formData.calidad) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsLoading(true);

    // Simulación de registro en blockchain
    setTimeout(() => {
      const mockHash = `0x${Math.random().toString(16).substring(2, 42)}`;
      
      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">¡Lote registrado exitosamente!</p>
          <p className="text-xs">Hash: {mockHash}</p>
        </div>,
        { duration: 5000 }
      );

      setIsLoading(false);
      
      // Guardar en localStorage para demo
      const existingLotes = JSON.parse(localStorage.getItem("lotes") || "[]");
      const newLote = {
        ...formData,
        hash: mockHash,
        timestamp: new Date().toISOString(),
        status: "Registrado",
      };
      localStorage.setItem("lotes", JSON.stringify([...existingLotes, newLote]));
      
      // Redirigir al rastreo después de 2 segundos
      setTimeout(() => {
        navigate(`/rastrear?lote=${formData.loteId}`);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Registrar Nuevo Lote</h1>
            <p className="text-muted-foreground">
              Registra tu producción de mangos en la blockchain
            </p>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Información del Lote</CardTitle>
              <CardDescription>
                Completa los datos del lote de mangos para registrarlo en Polygon Mumbai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="loteId">ID del Lote *</Label>
                  <Input
                    id="loteId"
                    placeholder="Ej: MG-2024-001"
                    value={formData.loteId}
                    onChange={(e) => setFormData({ ...formData, loteId: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productor">Nombre del Productor *</Label>
                  <Input
                    id="productor"
                    placeholder="Ej: Juan Pérez"
                    value={formData.productor}
                    onChange={(e) => setFormData({ ...formData, productor: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Select
                    value={formData.ubicacion}
                    onValueChange={(value) => setFormData({ ...formData, ubicacion: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Piura">Piura</SelectItem>
                      <SelectItem value="Lambayeque">Lambayeque</SelectItem>
                      <SelectItem value="Ica">Ica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calidad">Grado de Calidad *</Label>
                  <Select
                    value={formData.calidad}
                    onValueChange={(value) => setFormData({ ...formData, calidad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la calidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Exportación">Exportación</SelectItem>
                      <SelectItem value="Primera">Primera</SelectItem>
                      <SelectItem value="Segunda">Segunda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando en Blockchain...
                    </>
                  ) : (
                    "Registrar en Blockchain"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Al registrar, se creará una transacción en Polygon Mumbai Testnet. 
              Asegúrate de tener MetaMask instalado y conectado a la red de prueba.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registrar;
