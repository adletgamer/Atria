import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Search, Shield, Truck, FileText, RefreshCw, CheckCircle, Users, Target, ArrowRight, Leaf, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-bg.jpg";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }),
};

const Index = () => {
  const features = [
    { icon: Shield, title: "Seguridad Blockchain", description: "Cada transacción registrada de forma inmutable en Polygon" },
    { icon: Package, title: "Trazabilidad Total", description: "Sigue tu lote desde la finca en Piura hasta el consumidor final" },
    { icon: Search, title: "Búsqueda Instantánea", description: "Accede al historial completo con solo el ID del lote" },
    { icon: Truck, title: "Cadena Transparente", description: "Visualiza cada paso: Productor → Exportador → Supermercado" },
  ];

  const steps = [
    { icon: FileText, title: "Registra tu Lote", description: "Ingresa los datos de tu cosecha y recibe un ID único en blockchain", number: "01" },
    { icon: RefreshCw, title: "Transfiere Propiedad", description: "Actualiza la titularidad al vender con historial inmutable permanente", number: "02" },
    { icon: CheckCircle, title: "Verifica Autenticidad", description: "Los compradores escanean el QR para ver todo el historial verificado", number: "03" },
  ];

  const valueProposals = [
    {
      category: "Para Productores",
      icon: Leaf,
      benefits: ["Certificación digital de origen", "Valor agregado para exportación", "Acceso a mercados premium", "Financiamiento anticipado tokenizando cosechas"],
      gradient: "bg-gradient-mango",
    },
    {
      category: "Para Compradores",
      icon: Target,
      benefits: ["Garantía de autenticidad", "Historial completo del producto", "Apoyo a agricultores locales", "Transparencia total"],
      gradient: "bg-gradient-earth",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt="Plantación de mangos en Piura" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero" />
          {/* Grain overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center text-center"
            >
              {/* Badge */}
              <motion.div custom={0} variants={fadeUp} className="mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-sm font-medium text-white/90 border border-white/10">
                  <Zap className="h-4 w-4 text-accent" />
                  Primer piloto del Protocolo HarvestLink
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1 custom={1} variants={fadeUp} className="text-5xl sm:text-6xl md:text-8xl font-extrabold text-white leading-[0.95] tracking-tight mb-6 font-display">
                Mango<span className="text-gradient-mango">Chain</span>
              </motion.h1>

              <motion.p custom={2} variants={fadeUp} className="text-lg sm:text-xl md:text-2xl text-white/75 max-w-2xl mb-10 leading-relaxed font-light">
                Tokenizando cosechas futuras para dar liquidez y equidad a los agricultores peruanos
              </motion.p>

              {/* CTAs */}
              <motion.div custom={3} variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <Link to="/registrar">
                  <Button size="lg" className="bg-gradient-mango text-primary-foreground font-semibold px-8 py-6 rounded-2xl shadow-elevated hover:scale-[1.03] transition-all duration-300 text-base">
                    Registrar Lote
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/rastrear">
                  <Button size="lg" variant="outline" className="border-2 border-white/25 text-white hover:bg-white/10 font-semibold px-8 py-6 rounded-2xl backdrop-blur-sm transition-all duration-300 text-base">
                    <Search className="mr-2 h-5 w-5" />
                    Rastrear Lote
                  </Button>
                </Link>
              </motion.div>

              {/* Stats Row */}
              <motion.div custom={4} variants={fadeUp} className="mt-16 grid grid-cols-3 gap-6 sm:gap-12">
                {[
                  { value: "100%", label: "Transparente" },
                  { value: "Polygon", label: "Blockchain" },
                  { value: "🔒", label: "Inmutable" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center glass-dark rounded-2xl px-5 py-4 sm:px-8 sm:py-5">
                    <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-white/60 mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* How It Works */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="text-center mb-20">
            <motion.p custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Cómo funciona</motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold text-foreground font-display mb-4">
              3 pasos simples
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground max-w-xl mx-auto">
              Transforma tu cadena de suministro con tecnología blockchain fácilmente
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={index}
                variants={fadeUp}
                className="relative group"
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-14 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-border to-transparent z-0" />
                )}
                <div className="relative z-10 bg-card rounded-3xl p-8 shadow-card border border-border hover:shadow-elevated hover:-translate-y-1 transition-all duration-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-mango rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                      <step.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <span className="text-4xl font-extrabold text-muted-foreground/20 font-display">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold text-card-foreground mb-3 font-display">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposals */}
      <section className="py-24 sm:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="text-center mb-20">
            <motion.p custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-secondary mb-3">Propuesta de valor</motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold text-foreground font-display mb-4">
              Valor para todos
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground max-w-xl mx-auto">
              Beneficios tangibles para cada actor de la cadena de suministro
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {valueProposals.map((proposal, index) => (
              <motion.div
                key={proposal.category}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={index}
                variants={fadeUp}
                className="bg-card rounded-3xl p-10 shadow-card border border-border hover:shadow-elevated transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-14 h-14 ${proposal.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <proposal.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-card-foreground font-display">{proposal.category}</h3>
                </div>
                <ul className="space-y-4">
                  {proposal.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-secondary/15 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-3.5 w-3.5 text-secondary" />
                      </div>
                      <span className="text-card-foreground/80">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="text-center mb-20">
            <motion.p custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Tecnología</motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold text-foreground font-display mb-4">
              Tecnología confiable
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground max-w-xl mx-auto">
              Características técnicas que garantizan la seguridad de tus datos
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={index}
                variants={fadeUp}
                className="bg-card rounded-3xl p-8 shadow-card border border-border hover:shadow-elevated hover:-translate-y-1 transition-all duration-500 group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-gradient-mango group-hover:scale-110 transition-all duration-500">
                  <feature.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors duration-500" />
                </div>
                <h3 className="text-lg font-bold text-card-foreground mb-2 font-display">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mango opacity-95" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
        
        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <motion.h2 custom={0} variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold text-primary-foreground mb-6 font-display">
              ¿Listo para comenzar?
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="text-lg sm:text-xl text-primary-foreground/80 mb-10 max-w-xl mx-auto leading-relaxed">
              Únete a la revolución de la agricultura transparente y sostenible
            </motion.p>
            <motion.div custom={2} variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="bg-card text-primary hover:bg-card/90 font-semibold px-8 py-6 rounded-2xl shadow-elevated hover:scale-[1.03] transition-all duration-300 text-base">
                  Ver Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/rastrear">
                <Button size="lg" variant="outline" className="border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-8 py-6 rounded-2xl transition-all duration-300 text-base">
                  Probar Rastreo
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border bg-card">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-mango rounded-xl flex items-center justify-center">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold text-gradient-mango font-display">MangoChain</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            © 2025 MangoChain Tracker. Desarrollado para agricultores peruanos con tecnología blockchain.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
