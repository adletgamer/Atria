import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, Users, MapPin, Calendar, ArrowUpRight, Eye, Zap, Shield, Cpu, BarChart3, Database } from "lucide-react";
import peruMap from "@/assets/peru-map.png";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Lote {
  id: string;
  productor: string;
  ubicacion: string;
  calidad: string;
  fecha: string;
  hash?: string;
  status?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { isConnected, account, formatAddress } = useMetaMask();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [stats, setStats] = useState({
    totalLotes: 0,
    productoresActivos: 0,
    transacciones: 0,
    ubicaciones: 0
  });

  // Cargar datos reales desde localStorage
  useEffect(() => {
    const cargarDatos = () => {
      const lotesGuardados = JSON.parse(localStorage.getItem("lotes") || "[]");
      setLotes(lotesGuardados.slice(-4).reverse()); // Últimos 4 lotes, más recientes primero

      // Calcular estadísticas reales
      const productoresUnicos = new Set(lotesGuardados.map((lote: Lote) => lote.productor));
      const ubicacionesUnicas = new Set(lotesGuardados.map((lote: Lote) => lote.ubicacion));

      setStats({
        totalLotes: lotesGuardados.length,
        productoresActivos: productoresUnicos.size,
        transacciones: lotesGuardados.length * 2, // Simulación de transacciones
        ubicaciones: ubicacionesUnicas.size
      });
    };

    cargarDatos();

    // Escuchar cambios en localStorage
    const handleStorageChange = () => cargarDatos();
    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const statsData = [
    {
      title: "Registered Batches",
      value: stats.totalLotes.toString(),
      description: "Total batches on blockchain",
      icon: Package,
      trend: { value: "+12%", isPositive: true },
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Active Producers",
      value: stats.productoresActivos.toString(),
      description: "Verified farmers",
      icon: Users,
      trend: { value: "+8%", isPositive: true },
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
      borderColor: "border-green-200"
    },
    {
      title: "Transactions",
      value: stats.transacciones.toString(),
      description: "On Polygon Amoy this month",
      icon: TrendingUp,
      trend: { value: "+23%", isPositive: true },
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
      borderColor: "border-purple-200"
    },
    {
      title: "Locations",
      value: stats.ubicaciones.toString(),
      description: "Active regions",
      icon: MapPin,
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
      borderColor: "border-orange-200"
    },
  ];

  const distributionData = [
    { label: "Premium", percentage: 45, color: "from-green-500 to-emerald-600" },
    { label: "Export", percentage: 35, color: "from-blue-500 to-cyan-600" },
    { label: "First Grade", percentage: 15, color: "from-yellow-500 to-amber-600" },
    { label: "Second Grade", percentage: 5, color: "from-slate-500 to-slate-600" },
  ];

  const handleViewLote = (loteId: string) => {
    navigate(`/rastrear?lote=${loteId}`);
  };

  const handleRegisterNew = () => {
    navigate("/registrar");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/20">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header with Wallet Info */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-xl">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                MangoChain Dashboard
              </h1>
              <p className="text-slate-600 text-lg mt-2">
                Real-time supply chain monitoring on Polygon Amoy
              </p>
            </div>
          </div>

          {isConnected && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 min-w-[320px] shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  Wallet Connected
                </span>
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-sm font-mono text-emerald-700 mb-2 bg-white/50 p-2 rounded-lg border border-emerald-200">
                {formatAddress(account)}
              </p>
              <p className="text-sm text-emerald-600 font-semibold">Polygon Amoy Testnet ✅</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {isConnected && (
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button
              onClick={handleRegisterNew}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-8 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
              size="lg"
            >
              <Package className="mr-3 h-5 w-5" />
              Register New Batch
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/rastrear")}
              className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg"
              size="lg"
            >
              <Eye className="mr-3 h-5 w-5" />
              Track Batches
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <div
              key={stat.title}
              className="transform hover:-translate-y-2 transition-all duration-300"
            >
              <StatsCard {...stat} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <Card className="lg:col-span-2 border-2 border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
            <CardHeader className="pb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900">
                      Production Map
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-lg">
                      Main mango producing regions in Peru
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                    <span className="text-slate-700 font-medium">High Production</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                    <span className="text-slate-700 font-medium">Medium Production</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <img
                src={peruMap}
                alt="Peru Map"
                className="max-h-[280px] object-contain mb-6 shadow-lg rounded-2xl border border-slate-200"
              />
              <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 shadow-lg">
                  <p className="font-bold text-green-800 text-lg">Piura</p>
                  <p className="text-green-600 text-sm font-medium">68% of production</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-200 shadow-lg">
                  <p className="font-bold text-yellow-800 text-lg">Lambayeque</p>
                  <p className="text-yellow-600 text-sm font-medium">25% of production</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 shadow-lg">
                  <p className="font-bold text-blue-800 text-lg">Ica</p>
                  <p className="text-blue-600 text-sm font-medium">7% of production</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 shadow-lg">
                  <p className="font-bold text-blue-800 text-lg">La Libertad</p>
                  <p className="text-blue-600 text-sm font-medium">7% of production</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-2 border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    Recent Batches
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-lg">
                    Latest registrations on Polygon Amoy
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {lotes.length > 0 ? (
                <div className="space-y-4">
                  {lotes.map((lote) => (
                    <div
                      key={lote.id}
                      className="flex flex-col gap-3 p-4 rounded-2xl border-2 border-slate-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white"
                      onClick={() => handleViewLote(lote.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg group-hover:text-green-700 transition-colors">
                            {lote.id}
                          </p>
                          <p className="text-slate-600 text-sm font-medium">{lote.productor}</p>
                        </div>
                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${lote.calidad === 'Premium' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                          lote.calidad === 'Exportación' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                            'bg-gradient-to-r from-yellow-500 to-amber-500 text-white'
                          } shadow-sm`}>
                          {lote.calidad}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-slate-500 text-sm font-medium flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {lote.ubicacion}
                        </p>
                        <p className="text-slate-500 text-sm font-medium">{lote.fecha}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-slate-600 text-lg mb-4 font-medium">No batches registered</p>
                  <Button
                    onClick={handleRegisterNew}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    Register First Batch
                  </Button>
                </div>
              )}

              {lotes.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full mt-6 border-2 border-green-200 text-green-700 hover:text-green-800 hover:bg-green-50 font-bold py-3 rounded-full transition-all duration-300"
                  onClick={() => navigate("/rastrear")}
                >
                  View All Batches
                  <ArrowUpRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Distribution Chart & Blockchain Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Distribution Chart */}
          <Card className="border-2 border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    Quality Distribution
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-lg">
                    Batch percentage by quality grade
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {distributionData.map((item, index) => (
                  <div key={item.label} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-slate-700 flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${item.color} shadow-sm`}></div>
                        {item.label}
                      </span>
                      <span className="text-lg font-bold text-slate-900">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-4 shadow-inner">
                      <div
                        className={`h-4 rounded-full bg-gradient-to-r ${item.color} shadow-lg transition-all duration-1000 ease-out`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Info */}
          <Card className="border-2 border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Cpu className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    Network Status
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-lg">
                    Polygon Amoy Testnet Information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                  <span className="text-lg font-bold text-green-800 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Network
                  </span>
                  <span className="text-lg text-green-700 font-bold font-mono">Polygon Amoy</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200">
                  <span className="text-lg font-bold text-blue-800 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Chain ID
                  </span>
                  <span className="text-lg text-blue-700 font-bold font-mono">80002</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                  <span className="text-lg font-bold text-purple-800 flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Block Explorer
                  </span>
                  <a
                    href="https://amoy.polygonscan.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg text-purple-700 hover:text-purple-800 hover:underline flex items-center gap-2 font-bold transition-all duration-200"
                  >
                    polygonscan.com
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200">
                  <span className="text-lg font-bold text-orange-800 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Batches on Blockchain
                  </span>
                  <span className="text-2xl text-orange-700 font-black">{stats.totalLotes}</span>
                </div>
              </div>

              {!isConnected && (
                <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl">
                  <p className="text-amber-800 text-lg font-bold text-center">
                    Connect your wallet to start registering batches
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;