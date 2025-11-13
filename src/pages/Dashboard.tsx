import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, Users, MapPin, Calendar, ArrowUpRight, Eye } from "lucide-react";
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
      setLotes(lotesGuardados.slice(0, 4)); // Últimos 4 lotes

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
      title: "Lotes Registrados",
      value: stats.totalLotes.toString(),
      description: "Total de lotes en blockchain",
      icon: Package,
      trend: { value: "+12%", isPositive: true },
      color: "bg-blue-50 text-blue-700 border-blue-200"
    },
    {
      title: "Productores Activos",
      value: stats.productoresActivos.toString(),
      description: "Agricultores verificados",
      icon: Users,
      trend: { value: "+8%", isPositive: true },
      color: "bg-green-50 text-green-700 border-green-200"
    },
    {
      title: "Transacciones",
      value: stats.transacciones.toString(),
      description: "En Polygon Amoy este mes",
      icon: TrendingUp,
      trend: { value: "+23%", isPositive: true },
      color: "bg-purple-50 text-purple-700 border-purple-200"
    },
    {
      title: "Ubicaciones",
      value: stats.ubicaciones.toString(),
      description: "Regiones activas",
      icon: MapPin,
      color: "bg-orange-50 text-orange-700 border-orange-200"
    },
  ];

  const distributionData = [
    { label: "Premium", percentage: 45, color: "bg-gradient-to-r from-green-500 to-emerald-600" },
    { label: "Exportación", percentage: 35, color: "bg-gradient-to-r from-blue-500 to-cyan-600" },
    { label: "Primera", percentage: 15, color: "bg-gradient-to-r from-yellow-500 to-amber-600" },
    { label: "Segunda", percentage: 5, color: "bg-gradient-to-r from-gray-500 to-gray-600" },
  ];

  const handleViewLote = (loteId: string) => {
    navigate(`/rastrear?lote=${loteId}`);
  };

  const handleRegisterNew = () => {
    navigate("/registrar");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header con Wallet Info */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard MangoChain</h1>
            <p className="text-muted-foreground">
              Monitoreo en tiempo real de la cadena de suministro en Polygon Amoy
            </p>
          </div>
          
          {isConnected && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 min-w-[280px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-green-800">Wallet Conectada</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-xs font-mono text-green-700 mb-1">{formatAddress(account)}</p>
              <p className="text-xs text-green-600">Polygon Amoy Testnet ✅</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {isConnected && (
          <div className="flex gap-4 mb-8">
            <Button 
              onClick={handleRegisterNew}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Package className="mr-2 h-4 w-4" />
              Registrar Nuevo Lote
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/rastrear")}
            >
              <Eye className="mr-2 h-4 w-4" />
              Rastrear Lotes
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <Card className="lg:col-span-2 shadow-soft border-0 bg-gradient-to-br from-white to-blue-50/50">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Mapa de Producción
                  </CardTitle>
                  <CardDescription>
                    Principales regiones productoras de mango en Perú
                  </CardDescription>
                </div>
                <div className="flex gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Alta Producción</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Media Producción</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <img 
                src={peruMap} 
                alt="Mapa del Perú" 
                className="max-h-[300px] object-contain mb-4"
              />
              <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-semibold text-green-800">Piura</p>
                  <p className="text-sm text-green-600">68% de producción</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="font-semibold text-yellow-800">Lambayeque</p>
                  <p className="text-sm text-yellow-600">25% de producción</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-800">Ica</p>
                  <p className="text-sm text-blue-600">7% de producción</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-soft border-0 bg-gradient-to-br from-white to-green-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Lotes Recientes
              </CardTitle>
              <CardDescription>
                Últimos registros en Polygon Amoy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lotes.length > 0 ? (
                <div className="space-y-4">
                  {lotes.map((lote) => (
                    <div
                      key={lote.id}
                      className="flex flex-col gap-2 p-3 rounded-lg border border-border hover:border-green-300 transition-colors cursor-pointer group"
                      onClick={() => handleViewLote(lote.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm group-hover:text-green-700 transition-colors">
                            {lote.id}
                          </p>
                          <p className="text-sm text-muted-foreground">{lote.productor}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          lote.calidad === 'Premium' ? 'bg-green-100 text-green-800' :
                          lote.calidad === 'Exportación' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {lote.calidad}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {lote.ubicacion}
                        </p>
                        <p className="text-xs text-muted-foreground">{lote.fecha}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No hay lotes registrados</p>
                  <Button 
                    onClick={handleRegisterNew}
                    size="sm"
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Registrar Primer Lote
                  </Button>
                </div>
              )}
              
              {lotes.length > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => navigate("/rastrear")}
                >
                  Ver todos los lotes
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Distribution Chart & Blockchain Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Distribution Chart */}
          <Card className="shadow-soft border-0 bg-gradient-to-br from-white to-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Distribución por Calidad
              </CardTitle>
              <CardDescription>
                Porcentaje de lotes según grado de calidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {distributionData.map((item, index) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color.replace('bg-gradient-to-r', 'bg')}`}></div>
                        {item.label}
                      </span>
                      <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${item.color} transition-all duration-1000 ease-out`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Info */}
          <Card className="shadow-soft border-0 bg-gradient-to-br from-white to-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Estado de la Red
              </CardTitle>
              <CardDescription>
                Información de Polygon Amoy Testnet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-sm font-medium text-green-800">Red</span>
                  <span className="text-sm text-green-700 font-mono">Polygon Amoy</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-blue-800">Chain ID</span>
                  <span className="text-sm text-blue-700 font-mono">80002</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="text-sm font-medium text-purple-800">Block Explorer</span>
                  <a 
                    href="https://amoy.polygonscan.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-purple-700 hover:underline flex items-center gap-1"
                  >
                    amoy.polygonscan.com
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-sm font-medium text-orange-800">Lotes en Blockchain</span>
                  <span className="text-sm text-orange-700 font-semibold">{stats.totalLotes}</span>
                </div>
              </div>
              
              {!isConnected && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 text-center">
                    Conecta tu wallet para comenzar a registrar lotes
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