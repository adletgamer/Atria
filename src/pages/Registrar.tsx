import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Wallet, MapPin, User, Barcode, Award, Shield, Zap } from "lucide-react";
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
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!formData.loteId || !formData.productor || !formData.calidad) {
      toast.error("Please complete all fields");
      return;
    }

    setIsLoading(true);

    // Simulación de registro en blockchain
    setTimeout(() => {
      const mockHash = `0x${Math.random().toString(16).substring(2, 42)}`;
      
      toast.success(
        <div className="space-y-2 p-2">
          <p className="font-bold text-lg">✅ Batch successfully registered on Blockchain!</p>
          <div className="bg-slate-100 rounded-lg p-3">
            <p className="text-sm font-mono break-all">{mockHash}</p>
            <p className="text-xs text-slate-600 mt-1">Network: Polygon Amoy Testnet</p>
          </div>
        </div>,
        { duration: 8000 }
      );

      setIsLoading(false);
      
      // Guardar en localStorage para demo
      const existingLotes = JSON.parse(localStorage.getItem("lotes") || "[]");
      const newLote = {
        ...formData,
        hash: mockHash,
        timestamp: new Date().toISOString(),
        status: "Registered",
        blockchain: "Polygon Amoy",
        walletAddress: account,
        network: "Polygon Amoy Testnet"
      };
      localStorage.setItem("lotes", JSON.stringify([...existingLotes, newLote]));
      
      // Redirigir al rastreo
      setTimeout(() => {
        navigate(`/rastrear?lote=${formData.loteId}`);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/30">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-slate-200 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Register New Batch
                </h1>
                <p className="text-slate-600 text-lg">
                  Register your mango production on Polygon Amoy Blockchain
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              {/* Network Status Card */}
              <Card className="border-2 border-slate-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Network Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-sm font-medium text-blue-700">Network</span>
                    <span className="text-sm font-bold text-blue-900">Polygon Amoy</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-sm font-medium text-emerald-700">Chain ID</span>
                    <span className="text-sm font-bold text-emerald-900">80002</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-sm font-medium text-amber-700">Status</span>
                    <span className="text-sm font-bold text-amber-900">Testnet</span>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits Card */}
              <Card className="border-2 border-slate-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Award className="h-5 w-5 text-orange-500" />
                    Why Register?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Immutable blockchain record",
                    "Digital origin certification",
                    "Premium market access",
                    "Complete supply chain transparency"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 p-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{benefit}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Main Form */}
            <div className="lg:col-span-2">
              {/* Mostrar errores de red */}
              {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl shadow-md">
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                </div>
              )}

              {/* Wallet Connection Status */}
              {!isConnected ? (
                <Card className="border-2 border-amber-200 rounded-2xl shadow-xl bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-2xl transition-all duration-300">
                  <CardContent className="pt-8 text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                      <Wallet className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-amber-900 mb-3">
                      Wallet Not Connected
                    </h3>
                    <p className="text-amber-700 mb-6 text-lg leading-relaxed">
                      Connect your MetaMask wallet to register batches on Polygon Amoy Testnet
                    </p>
                    <Button 
                      onClick={handleConnectWallet}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-8 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
                      size="lg"
                    >
                      <Wallet className="mr-3 h-5 w-5" />
                      Connect Wallet
                    </Button>
                    <div className="mt-6 p-4 bg-blue-50/80 border-2 border-blue-200 rounded-2xl backdrop-blur-sm">
                      <p className="text-blue-800 font-semibold text-sm">
                        <strong>Required Network:</strong> Polygon Amoy Testnet (Chain ID: 80002)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Wallet Connected Info */}
                  <div className="mb-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-800 font-bold text-lg flex items-center gap-2">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                          ✅ Wallet Connected
                        </p>
                        <p className="text-emerald-700 font-mono text-sm mt-1">
                          {formatAddress(account)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-600 text-sm font-semibold">
                          Network: Polygon Amoy Testnet ✅
                        </p>
                      </div>
                    </div>
                  </div>

                  <Card className="border-2 border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                          <Barcode className="h-6 w-6 text-white" />
                        </div>
                        Batch Information
                      </CardTitle>
                      <CardDescription className="text-slate-600 text-lg">
                        Complete the mango batch data to register it on Polygon Amoy Testnet
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Batch ID Field */}
                        <div className="space-y-3">
                          <Label htmlFor="loteId" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                            <Barcode className="h-4 w-4 text-orange-500" />
                            Batch ID *
                          </Label>
                          <Input
                            id="loteId"
                            placeholder="Example: MG-2024-001"
                            value={formData.loteId}
                            onChange={(e) => setFormData({ ...formData, loteId: e.target.value })}
                            className="border-2 border-slate-200 rounded-xl px-4 py-3 text-lg hover:border-orange-300 focus:border-orange-500 transition-colors duration-200"
                            required
                          />
                        </div>

                        {/* Producer Field */}
                        <div className="space-y-3">
                          <Label htmlFor="productor" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                            <User className="h-4 w-4 text-orange-500" />
                            Producer Name *
                          </Label>
                          <Input
                            id="productor"
                            placeholder="Example: Juan Pérez"
                            value={formData.productor}
                            onChange={(e) => setFormData({ ...formData, productor: e.target.value })}
                            className="border-2 border-slate-200 rounded-xl px-4 py-3 text-lg hover:border-orange-300 focus:border-orange-500 transition-colors duration-200"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Location Field */}
                          <div className="space-y-3">
                            <Label htmlFor="ubicacion" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-orange-500" />
                              Location
                            </Label>
                            <Select
                              value={formData.ubicacion}
                              onValueChange={(value) => setFormData({ ...formData, ubicacion: value })}
                            >
                              <SelectTrigger className="border-2 border-slate-200 rounded-xl px-4 py-3 text-lg hover:border-orange-300 focus:border-orange-500 transition-colors duration-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-2 border-slate-200">
                                <SelectItem value="Piura" className="text-lg py-3">Piura</SelectItem>
                                <SelectItem value="Lambayeque" className="text-lg py-3">Lambayeque</SelectItem>
                                <SelectItem value="Ica" className="text-lg py-3">Ica</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Quality Field */}
                          <div className="space-y-3">
                            <Label htmlFor="calidad" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                              <Award className="h-4 w-4 text-orange-500" />
                              Quality Grade *
                            </Label>
                            <Select
                              value={formData.calidad}
                              onValueChange={(value) => setFormData({ ...formData, calidad: value })}
                            >
                              <SelectTrigger className="border-2 border-slate-200 rounded-xl px-4 py-3 text-lg hover:border-orange-300 focus:border-orange-500 transition-colors duration-200">
                                <SelectValue placeholder="Select quality" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-2 border-slate-200">
                                <SelectItem value="Premium" className="text-lg py-3">Premium</SelectItem>
                                <SelectItem value="Exportación" className="text-lg py-3">Export</SelectItem>
                                <SelectItem value="Primera" className="text-lg py-3">First Grade</SelectItem>
                                <SelectItem value="Segunda" className="text-lg py-3">Second Grade</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 text-lg mt-6"
                          disabled={isLoading}
                          size="lg"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                              Registering on Blockchain...
                            </>
                          ) : (
                            <>
                              <Zap className="mr-3 h-5 w-5" />
                              Register on Polygon Amoy
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Info Note */}
                  <div className="mt-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200 rounded-2xl shadow-lg">
                    <p className="text-slate-700 text-lg leading-relaxed">
                      <strong>Note:</strong> When registering, a transaction will be simulated on Polygon Amoy Testnet. 
                      Make sure you have test MATIC in your wallet for future real transactions.
                    </p>
                    <p className="text-slate-600 text-sm mt-3 font-semibold">
                      <strong>Network:</strong> Polygon Amoy Testnet (Chain ID: 80002)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add missing CheckCircle icon component
const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default Registrar;