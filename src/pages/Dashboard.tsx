import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, Users, MapPin } from "lucide-react";
import peruMap from "@/assets/peru-map.png";

const Dashboard = () => {
  const stats = [
    {
      title: "Lotes Registrados",
      value: "1,234",
      description: "Total de lotes en la plataforma",
      icon: Package,
      trend: { value: "12%", isPositive: true },
    },
    {
      title: "Productores Activos",
      value: "156",
      description: "Agricultores verificados",
      icon: Users,
      trend: { value: "8%", isPositive: true },
    },
    {
      title: "Transacciones",
      value: "3,421",
      description: "En blockchain este mes",
      icon: TrendingUp,
      trend: { value: "23%", isPositive: true },
    },
    {
      title: "Ubicaciones",
      value: "3",
      description: "Regiones principales",
      icon: MapPin,
    },
  ];

  const recentLotes = [
    { id: "MG-2024-001", productor: "Juan Pérez", ubicacion: "Piura", calidad: "Premium", fecha: "Hace 2 horas" },
    { id: "MG-2024-002", productor: "María García", ubicacion: "Piura", calidad: "Exportación", fecha: "Hace 5 horas" },
    { id: "MG-2024-003", productor: "Carlos Ruiz", ubicacion: "Lambayeque", calidad: "Primera", fecha: "Hace 1 día" },
    { id: "MG-2024-004", productor: "Ana Torres", ubicacion: "Piura", calidad: "Premium", fecha: "Hace 1 día" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Estadísticas y seguimiento de la cadena de suministro MangoChain
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader>
              <CardTitle>Mapa de Producción</CardTitle>
              <CardDescription>
                Principales regiones productoras de mango en Perú
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <img 
                src={peruMap} 
                alt="Mapa del Perú" 
                className="max-h-[400px] object-contain"
              />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Lotes Recientes</CardTitle>
              <CardDescription>
                Últimos registros en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLotes.map((lote) => (
                  <div
                    key={lote.id}
                    className="flex flex-col gap-1 pb-4 border-b border-border last:border-0"
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm">{lote.id}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {lote.calidad}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{lote.productor}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">{lote.ubicacion}</p>
                      <p className="text-xs text-muted-foreground">{lote.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Chart */}
        <Card className="mt-6 shadow-soft">
          <CardHeader>
            <CardTitle>Distribución por Calidad</CardTitle>
            <CardDescription>
              Porcentaje de lotes según grado de calidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Premium</span>
                  <span className="text-sm text-muted-foreground">45%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "45%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Exportación</span>
                  <span className="text-sm text-muted-foreground">35%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-secondary h-2 rounded-full" style={{ width: "35%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Primera</span>
                  <span className="text-sm text-muted-foreground">15%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: "15%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Segunda</span>
                  <span className="text-sm text-muted-foreground">5%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-muted-foreground h-2 rounded-full" style={{ width: "5%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
