import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, Package, MapPin, User, Calendar, ArrowRight, CheckCircle, Truck, Shield, Barcode, Award } from "lucide-react";
import { toast } from "sonner";
import QRGenerator from "@/components/QRGenerator";

const Rastrear = () => {
  const [searchParams] = useSearchParams();
  const [loteId, setLoteId] = useState("");
  const [loteData, setLoteData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const initialLote = searchParams.get("lote");
    if (initialLote) {
      setLoteId(initialLote);
      handleSearch(initialLote);
    }
  }, []);

  const handleSearch = async (searchId?: string) => {
    const searchValue = searchId || loteId;

    if (!searchValue) {
      toast.error("Please enter a batch ID");
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
          timestamp: lote.timestamp,
          network: lote.network,
          steps: [
            {
              id: "1",
              title: "Producer - Piura",
              description: `Registered by ${lote.productor}`,
              date: new Date(lote.timestamp).toLocaleDateString("en-US"),
              completed: true,
              icon: User,
            },
            {
              id: "2",
              title: "Exporter",
              description: "In export process",
              date: new Date(Date.now() + 86400000).toLocaleDateString("en-US"),
              completed: false,
              current: true,
              icon: Truck,
            },
            {
              id: "3",
              title: "Supermarket - Lima",
              description: "In distribution",
              completed: false,
              icon: Package,
            },
            {
              id: "4",
              title: "Final Customer",
              description: "Delivered to consumer",
              completed: false,
              icon: CheckCircle,
            },
          ],
        };
        setLoteData(timelineData);
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-semibold">Batch found successfully!</span>
          </div>
        );
      } else {
        toast.error("Batch not found. Try with: MG-2024-001");
        setLoteData(null);
      }

      setIsSearching(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl border border-slate-200 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Search className="h-7 w-7 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                  Track Batch
                </h1>
                <p className="text-slate-600 text-lg">
                  Search for your mango batch and view its complete traceability
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Side - Search Card */}
            <div className="lg:col-span-1">
              <Card className="border-2 border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-white sticky top-8">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-slate-900 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl flex items-center justify-center">
                      <Search className="h-5 w-5 text-white" />
                    </div>
                    Search by Batch ID
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-base">
                    Enter the unique code of your mango batch
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="search" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-blue-500" />
                      Batch ID
                    </Label>
                    <Input
                      id="search"
                      placeholder="Example: MG-2024-001"
                      value={loteId}
                      onChange={(e) => setLoteId(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="border-2 border-slate-200 rounded-xl px-4 py-3 text-lg hover:border-blue-300 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <Button
                    onClick={() => handleSearch()}
                    className="w-full bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-bold py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg"
                    disabled={isSearching}
                    size="lg"
                  >
                    {isSearching ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-3 h-5 w-5" />
                        Search Batch
                      </>
                    )}
                  </Button>

                  {/* Quick Tip */}
                  <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                    <p className="text-amber-800 text-sm font-medium">
                      <strong>Tip:</strong> Try with demo ID: MG-2024-001
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Results */}
            <div className="lg:col-span-3">
              {loteData ? (
                <div className="space-y-8">
                  {/* Batch Information Card */}
                  <Card className="border-2 border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
                    <CardHeader className="pb-6">
                      <CardTitle className="flex items-center gap-3 text-slate-900 text-2xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        Batch Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Barcode className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-semibold">Batch ID</span>
                          </div>
                          <p className="text-lg font-bold text-slate-900">{loteData.loteId}</p>
                        </div>

                        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="flex items-center gap-2 text-slate-600">
                            <User className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-semibold">Producer</span>
                          </div>
                          <p className="text-lg font-bold text-slate-900">{loteData.productor}</p>
                        </div>

                        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-semibold">Location</span>
                          </div>
                          <p className="text-lg font-bold text-slate-900">{loteData.ubicacion}</p>
                        </div>

                        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Award className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-semibold">Quality Grade</span>
                          </div>
                          <p className="text-lg font-bold text-slate-900">{loteData.calidad}</p>
                        </div>

                        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Shield className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-semibold">Network</span>
                          </div>
                          <p className="text-lg font-bold text-slate-900">{loteData.network}</p>
                        </div>

                        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="text-sm font-semibold">Registration Date</span>
                          </div>
                          <p className="text-lg font-bold text-slate-900">
                            {new Date(loteData.timestamp).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* QR Code Section */}
                      <div className="mt-6 flex flex-col md:flex-row gap-6">
                        <div className="flex-1 p-4 bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-blue-200 rounded-2xl">
                          <div className="flex items-center gap-2 mb-3">
                            <Shield className="h-5 w-5 text-blue-600" />
                            <span className="text-lg font-bold text-blue-900">Transaction Hash</span>
                          </div>
                          <p className="font-mono text-sm break-all bg-white/80 p-3 rounded-xl border border-blue-200">
                            {loteData.hash}
                          </p>
                          <p className="text-blue-700 text-sm mt-2 font-medium">
                            🔒 Immutably recorded on Polygon Amoy Blockchain
                          </p>
                        </div>

                        <div className="flex-shrink-0 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col items-center">
                          <p className="text-sm font-bold text-slate-700 mb-2">Batch QR Code</p>
                          <QRGenerator batchId={loteData.loteId} size={120} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline Card */}
                  <Card className="border-2 border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
                    <CardHeader className="pb-6">
                      <CardTitle className="flex items-center gap-3 text-slate-900 text-2xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <Truck className="h-6 w-6 text-white" />
                        </div>
                        Supply Chain Timeline
                      </CardTitle>
                      <CardDescription className="text-slate-600 text-lg">
                        Track the batch from its origin to the final consumer
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-200 rounded-full" />

                        <div className="space-y-8 relative">
                          {loteData.steps.map((step: any, index: number) => (
                            <div key={step.id} className="flex gap-6 relative">
                              {/* Icon */}
                              <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white transition-all duration-300 ${step.completed
                                  ? "bg-gradient-to-br from-green-500 to-emerald-500"
                                  : step.current
                                    ? "bg-gradient-to-br from-blue-500 to-sky-500 animate-pulse"
                                    : "bg-slate-200"
                                }`}>
                                <step.icon className={`h-8 w-8 ${step.completed || step.current ? "text-white" : "text-slate-400"}`} />
                              </div>

                              {/* Content */}
                              <div className={`flex-1 p-6 rounded-2xl border-2 transition-all duration-300 ${step.completed
                                  ? "bg-green-50 border-green-200"
                                  : step.current
                                    ? "bg-blue-50 border-blue-200 shadow-md"
                                    : "bg-slate-50 border-slate-200"
                                }`}>
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className={`text-xl font-bold ${step.completed ? "text-green-900" : step.current ? "text-blue-900" : "text-slate-700"
                                    }`}>
                                    {step.title}
                                  </h4>
                                  {step.date && (
                                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${step.completed ? "bg-green-200 text-green-800" : "bg-blue-200 text-blue-800"
                                      }`}>
                                      {step.date}
                                    </span>
                                  )}
                                </div>
                                <p className={`${step.completed ? "text-green-700" : step.current ? "text-blue-700" : "text-slate-500"
                                  }`}>
                                  {step.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                !isSearching && (
                  <Card className="border-2 border-slate-200 rounded-2xl shadow-xl bg-white">
                    <CardContent className="py-16 text-center">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                        <Package className="h-10 w-10 text-slate-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-700 mb-3">
                        Ready to Track
                      </h3>
                      <p className="text-slate-600 text-lg mb-2">
                        Enter a batch ID to start tracking
                      </p>
                      <p className="text-slate-500 text-sm">
                        Try with demo ID: MG-2024-001
                      </p>
                    </CardContent>
                  </Card>
                )
              )}

              {isSearching && (
                <Card className="border-2 border-slate-200 rounded-2xl shadow-xl bg-white">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700 mb-3">
                      Searching Blockchain...
                    </h3>
                    <p className="text-slate-600 text-lg">
                      Looking for batch on Polygon Amoy Network
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rastrear;