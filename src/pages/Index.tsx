import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Search, Shield, Truck } from "lucide-react";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-bg.jpg";

const Index = () => {
  const features = [
    {
      icon: Shield,
      title: "Seguridad Blockchain",
      description: "Cada transacción registrada de forma inmutable en Polygon Mumbai Testnet",
    },
    {
      icon: Package,
      title: "Trazabilidad Completa",
      description: "Sigue tu lote desde la finca en Piura hasta el consumidor final",
    },
    {
      icon: Search,
      title: "Búsqueda Rápida",
      description: "Accede al historial completo con solo el ID del lote",
    },
    {
      icon: Truck,
      title: "Cadena Transparente",
      description: "Visualiza cada paso: Productor → Exportador → Supermercado",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            MangoChain Tracker
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto drop-shadow-md">
            Seguimiento de mangos peruanos con tecnología blockchain
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/registrar">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-glow">
                Registrar Lote
              </Button>
            </Link>
            <Link to="/rastrear">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                Rastrear Lote
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Qué es MangoChain?
            </h2>
            <p className="text-lg text-muted-foreground">
              Una plataforma innovadora que utiliza tecnología blockchain para garantizar 
              la trazabilidad completa de los mangos peruanos desde su origen en Piura 
              hasta el consumidor final, brindando transparencia y confianza en cada paso 
              de la cadena de suministro.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="shadow-soft hover:shadow-glow transition-all">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Únete a la revolución de la agricultura transparente y sostenible
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              Ver Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 MangoChain Tracker. Desarrollado para agricultores peruanos.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
