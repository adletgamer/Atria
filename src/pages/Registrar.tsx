import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useMetaMask } from "@/hooks/useMetaMask";

const Registrar = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, connectWallet, formatAddress, account, error } = useMetaMask();
  const [formData, setFormData] = useState({
    loteId: "",
    productor: "",
    ubicacion: "Piura",
    calidad: "",
  });

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error("Por favor conecta tu wallet primero");
      return;
    }
    
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
          <p className="font-semibold">¡Lote registrado exitosamente en Blockchain!</p>
          <p className="text-xs font-mono">Transacción: {mockHash}</p>
          <p className="text-xs">Red: Polygon Amoy Testnet</p>
        </div>,
        { duration: 6000 }
      );

      setIsLoading(false);
      
      // Guardar en localStorage para demo
      const existingLotes = JSON.parse(localStorage.getItem("lotes") || "[]");
      const newLote = {
        ...formData,
        hash: mockHash,
        timestamp: new Date().toISOString(),
        status: "Registrado",
        blockchain: "Polygon Amoy", // CAMBIADO: Mumbai → Amoy
        walletAddress: account,
        network: "Polygon Amoy Testnet" // Nuevo campo
      };
      localStorage.setItem("lotes", JSON.stringify([...existingLotes, newLote]));
      
      // Redirigir al rastreo
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
              Registra tu producción de mangos en la blockchain de Polygon Amoy
            </p>
          </div>

          {/* Mostrar errores de red */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Wallet Connection Status */}
          {!isConnected ? (
            <Card className="shadow-soft border-yellow-200">
              <CardContent className="pt-6 text-center">
                <Wallet className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Wallet No Conectada
                </h3>
                <p className="text-yellow-700 mb-4">
                  Conecta tu wallet de MetaMask para registrar lotes en Polygon Amoy Testnet
                </p>
                <Button 
                  onClick={handleConnectWallet}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Conectar Wallet
                </Button>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    <strong>Red requerida:</strong> Polygon Amoy Testnet (Chain ID: 80002)
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Wallet Connected Info */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">
                  <span className="font-semibold">✅ Wallet conectada:</span>{" "}
                  <span className="font-mono">{formatAddress(account)}</span>
                </p>
                <p className="text-green-600 text-xs mt-1">
                  Red: Polygon Amoy Testnet ✅
                </p>
              </div>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Información del Lote</CardTitle>
                  <CardDescription>
                    Completa los datos del lote de mangos para registrarlo en Polygon Amoy Testnet
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
                        "Registrar en Polygon Amoy"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Nota:</strong> Al registrar, se simulará una transacción en Polygon Amoy Testnet. 
                  Asegúrate de tener MATIC de prueba en tu wallet para transacciones reales futuras.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Red:</strong> Polygon Amoy Testnet (Chain ID: 80002)
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Registrar;