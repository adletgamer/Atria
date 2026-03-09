import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Search, Shield, Truck, FileText, RefreshCw, CheckCircle, Users, Target, ArrowRight, Leaf, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-bg.jpg";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const }
  }),
};

const content = {
  es: {
    badge: "Primer piloto del Protocolo HarvestLink",
    subtitle: "Tokenizando cosechas futuras para dar liquidez y equidad a los agricultores peruanos",
    cta1: "Registrar Lote",
    cta2: "Rastrear Lote",
    stats: [
      { value: "100%", label: "Transparente" },
      { value: "Polygon", label: "Blockchain" },
      { value: "🔒", label: "Inmutable" },
    ],
    howTitle: "3 pasos simples",
    howLabel: "Cómo funciona",
    howDesc: "Transforma tu cadena de suministro con tecnología blockchain fácilmente",
    steps: [
      { title: "Registra tu Lote", description: "Ingresa los datos de tu cosecha y recibe un ID único en blockchain" },
      { title: "Transfiere Propiedad", description: "Actualiza la titularidad al vender con historial inmutable permanente" },
      { title: "Verifica Autenticidad", description: "Los compradores escanean el QR para ver todo el historial verificado" },
    ],
    valueLabel: "Propuesta de valor",
    valueTitle: "Valor para todos",
    valueDesc: "Beneficios tangibles para cada actor de la cadena de suministro",
    producers: { title: "Para Productores", benefits: ["Certificación digital de origen", "Valor agregado para exportación", "Acceso a mercados premium", "Financiamiento anticipado tokenizando cosechas"] },
    buyers: { title: "Para Compradores", benefits: ["Garantía de autenticidad", "Historial completo del producto", "Apoyo a agricultores locales", "Transparencia total"] },
    techLabel: "Tecnología",
    techTitle: "Tecnología confiable",
    techDesc: "Características técnicas que garantizan la seguridad de tus datos",
    features: [
      { title: "Seguridad Blockchain", description: "Cada transacción registrada de forma inmutable en Polygon" },
      { title: "Trazabilidad Total", description: "Sigue tu lote desde la finca en Piura hasta el consumidor final" },
      { title: "Búsqueda Instantánea", description: "Accede al historial completo con solo el ID del lote" },
      { title: "Cadena Transparente", description: "Visualiza cada paso: Productor → Exportador → Supermercado" },
    ],
    ctaTitle: "¿Listo para comenzar?",
    ctaDesc: "Únete a la revolución de la agricultura transparente y sostenible",
    ctaBtn1: "Ver Dashboard",
    ctaBtn2: "Probar Rastreo",
    footer: "Desarrollado para agricultores peruanos con tecnología blockchain.",
  },
  en: {
    badge: "First pilot of the HarvestLink Protocol",
    subtitle: "Tokenizing future harvests for farmer liquidity & equity",
    cta1: "Register Batch",
    cta2: "Track Batch",
    stats: [
      { value: "100%", label: "Transparent" },
      { value: "Polygon", label: "Blockchain" },
      { value: "🔒", label: "Immutable" },
    ],
    howTitle: "3 Simple Steps",
    howLabel: "How it works",
    howDesc: "Transform your supply chain with blockchain technology easily",
    steps: [
      { title: "Register Your Batch", description: "Enter your harvest data and receive a unique blockchain ID" },
      { title: "Transfer Ownership", description: "Update ownership when selling with permanent, immutable history" },
      { title: "Verify Authenticity", description: "Buyers scan QR code to view entire verified history" },
    ],
    valueLabel: "Value proposition",
    valueTitle: "Value for Everyone",
    valueDesc: "Tangible benefits for every actor in the supply chain",
    producers: { title: "For Producers", benefits: ["Digital origin certification", "Added value for export", "Access to premium markets", "Advance financing by tokenizing harvests"] },
    buyers: { title: "For Buyers", benefits: ["Authenticity guarantee", "Complete product history", "Support for local farmers", "Total transparency"] },
    techLabel: "Technology",
    techTitle: "Reliable Technology",
    techDesc: "Technical features that guarantee the security of your data",
    features: [
      { title: "Blockchain Security", description: "Every transaction immutably recorded on Polygon" },
      { title: "Complete Traceability", description: "Track your batch from the farm in Piura to the end consumer" },
      { title: "Instant Search", description: "Access complete history with just the batch ID" },
      { title: "Transparent Chain", description: "Visualize every step: Producer → Exporter → Supermarket" },
    ],
    ctaTitle: "Ready to Get Started?",
    ctaDesc: "Join the revolution of transparent and sustainable agriculture",
    ctaBtn1: "View Dashboard",
    ctaBtn2: "Try Tracking",
    footer: "Developed for Peruvian farmers with blockchain technology.",
  },
};

const featureIcons = [Shield, Package, Search, Truck];
const stepIcons = [FileText, RefreshCw, CheckCircle];

const Index = () => {
  const { lang } = useLanguage();
  const t = content[lang];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt="Plantación de mangos en Piura" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <motion.div initial="hidden" animate="visible" className="flex flex-col items-center text-center">
              <motion.div custom={0} variants={fadeUp} className="mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-sm font-medium text-white/90 border border-white/10">
                  <Zap className="h-4 w-4 text-accent" />
                  {t.badge}
                </span>
              </motion.div>

              <motion.h1 custom={1} variants={fadeUp} className="text-5xl sm:text-6xl md:text-8xl font-extrabold text-white leading-[0.95] tracking-tight mb-6 font-display">
                Mango<span className="text-gradient-mango">Chain</span>
              </motion.h1>

              <motion.p custom={2} variants={fadeUp} className="text-lg sm:text-xl md:text-2xl text-white/75 max-w-2xl mb-10 leading-relaxed font-light">
                {t.subtitle}
              </motion.p>

              <motion.div custom={3} variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <Link to="/registrar">
                  <Button size="lg" className="bg-gradient-mango text-primary-foreground font-semibold px-8 py-6 rounded-2xl shadow-elevated hover:scale-[1.03] transition-all duration-300 text-base">
                    {t.cta1}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/rastrear">
                  <Button size="lg" variant="outline" className="border-2 border-white/25 text-white hover:bg-white/10 font-semibold px-8 py-6 rounded-2xl backdrop-blur-sm transition-all duration-300 text-base">
                    <Search className="mr-2 h-5 w-5" />
                    {t.cta2}
                  </Button>
                </Link>
              </motion.div>

              <motion.div custom={4} variants={fadeUp} className="mt-16 grid grid-cols-3 gap-6 sm:gap-12">
                {t.stats.map((stat) => (
                  <div key={stat.label} className="text-center glass-dark rounded-2xl px-5 py-4 sm:px-8 sm:py-5">
                    <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-white/60 mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* How It Works */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="text-center mb-20">
            <motion.p custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">{t.howLabel}</motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold text-foreground font-display mb-4">{t.howTitle}</motion.h2>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground max-w-xl mx-auto">{t.howDesc}</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {t.steps.map((step, index) => {
              const Icon = stepIcons[index];
              return (
                <motion.div key={step.title} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={index} variants={fadeUp} className="relative group">
                  {index < t.steps.length - 1 && (
                    <div className="hidden md:block absolute top-14 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-border to-transparent z-0" />
                  )}
                  <div className="relative z-10 bg-card rounded-3xl p-8 shadow-card border border-border hover:shadow-elevated hover:-translate-y-1 transition-all duration-500">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-gradient-mango rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                        <Icon className="h-7 w-7 text-primary-foreground" />
                      </div>
                      <span className="text-4xl font-extrabold text-muted-foreground/20 font-display">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="text-xl font-bold text-card-foreground mb-3 font-display">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Value Proposals */}
      <section className="py-24 sm:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="text-center mb-20">
            <motion.p custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-secondary mb-3">{t.valueLabel}</motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold text-foreground font-display mb-4">{t.valueTitle}</motion.h2>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground max-w-xl mx-auto">{t.valueDesc}</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              { ...t.producers, icon: Leaf, gradient: "bg-gradient-mango" },
              { ...t.buyers, icon: Target, gradient: "bg-gradient-earth" },
            ].map((proposal, index) => (
              <motion.div key={proposal.title} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={index} variants={fadeUp}
                className="bg-card rounded-3xl p-10 shadow-card border border-border hover:shadow-elevated transition-all duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-14 h-14 ${proposal.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <proposal.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-card-foreground font-display">{proposal.title}</h3>
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

      {/* Features */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="text-center mb-20">
            <motion.p custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">{t.techLabel}</motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold text-foreground font-display mb-4">{t.techTitle}</motion.h2>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground max-w-xl mx-auto">{t.techDesc}</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {t.features.map((feature, index) => {
              const Icon = featureIcons[index];
              return (
                <motion.div key={feature.title} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={index} variants={fadeUp}
                  className="bg-card rounded-3xl p-8 shadow-card border border-border hover:shadow-elevated hover:-translate-y-1 transition-all duration-500 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-gradient-mango group-hover:scale-110 transition-all duration-500">
                    <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors duration-500" />
                  </div>
                  <h3 className="text-lg font-bold text-card-foreground mb-2 font-display">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mango opacity-95" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <motion.h2 custom={0} variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold text-primary-foreground mb-6 font-display">{t.ctaTitle}</motion.h2>
            <motion.p custom={1} variants={fadeUp} className="text-lg sm:text-xl text-primary-foreground/80 mb-10 max-w-xl mx-auto leading-relaxed">{t.ctaDesc}</motion.p>
            <motion.div custom={2} variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="bg-card text-primary hover:bg-card/90 font-semibold px-8 py-6 rounded-2xl shadow-elevated hover:scale-[1.03] transition-all duration-300 text-base">
                  {t.ctaBtn1}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/rastrear">
                <Button size="lg" variant="outline" className="border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-8 py-6 rounded-2xl transition-all duration-300 text-base">
                  {t.ctaBtn2}
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
              <img src={logo} alt="MangoChain" className="h-6 w-6" />
            </div>
            <span className="text-xl font-extrabold text-gradient-mango font-display">MangoChain</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            © 2025 MangoChain Tracker. {t.footer}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
