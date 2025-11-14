import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Search, Shield, Truck, FileText, RefreshCw, CheckCircle, Users, Target, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-bg.jpg";

const Index = () => {
  const features = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Every transaction immutably recorded on Polygon Mumbai Testnet",
    },
    {
      icon: Package,
      title: "Complete Traceability",
      description: "Track your batch from the farm in Piura to the end consumer",
    },
    {
      icon: Search,
      title: "Fast Search",
      description: "Access complete history with just the batch ID",
    },
    {
      icon: Truck,
      title: "Transparent Chain",
      description: "Visualize every step: Producer → Exporter → Supermarket",
    },
  ];

  const steps = [
    {
      icon: FileText,
      title: "Register Your Batch",
      description: "Enter basic harvest data and receive a unique blockchain ID",
      number: "01"
    },
    {
      icon: RefreshCw,
      title: "Transfer Ownership",
      description: "Update ownership when selling with permanent, immutable history",
      number: "02"
    },
    {
      icon: CheckCircle,
      title: "Verify Authenticity",
      description: "Buyers scan QR code to view entire history with verified trust",
      number: "03"
    }
  ];

  const valueProposals = [
    {
      category: "For Producers",
      icon: Users,
      benefits: [
        "Digital origin certification",
        "Added value for export",
        "Access to premium markets",
        "Reduction of intermediaries"
      ],
      gradient: "from-orange-500 to-amber-500"
    },
    {
      category: "For Buyers",
      icon: Target,
      benefits: [
        "Authenticity guarantee",
        "Complete product history",
        "Support for local farmers",
        "Total transparency"
      ],
      gradient: "from-blue-500 to-sky-500"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[700px] flex items-center justify-center overflow-hidden">
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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-black mb-6 drop-shadow-2xl leading-tight">
              MangoChain
              <span className="block text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent mt-2">
                Tracker
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto drop-shadow-md leading-relaxed">
              Peruvian mango tracking with blockchain technology
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/registrar">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-8 py-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 text-lg"
                >
                  Register Batch
                </Button>
              </Link>
              <Link to="/rastrear">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white/20 font-bold px-8 py-4 rounded-full backdrop-blur-sm hover:scale-105 transition-all duration-300 text-lg"
                >
                  Track Batch
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Stats */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-8 text-white/80">
          <div className="text-center backdrop-blur-sm bg-white/10 rounded-2xl px-6 py-3">
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm">Transparent</div>
          </div>
          <div className="text-center backdrop-blur-sm bg-white/10 rounded-2xl px-6 py-3">
            <div className="text-2xl font-bold">✓</div>
            <div className="text-sm">Verified</div>
          </div>
          <div className="text-center backdrop-blur-sm bg-white/10 rounded-2xl px-6 py-3">
            <div className="text-2xl font-bold">🔒</div>
            <div className="text-sm">Secure</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              How It Works in 3 Simple Steps
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Transform your supply chain with blockchain technology easily
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div 
                key={step.title}
                className="relative group"
              >
                <Card className="h-full border-2 border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 bg-white group-hover:border-orange-200">
                  <CardHeader className="text-center">
                    <div className="relative mb-4">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <step.icon className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                        {step.number}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 mb-3">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600 text-center text-base leading-relaxed">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposal Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Value for Everyone
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Tangible benefits for every actor in the supply chain
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {valueProposals.map((proposal) => (
              <div 
                key={proposal.category}
                className="relative group"
              >
                <Card className="h-full border-2 border-slate-200 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 bg-white">
                  <CardHeader className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                      <proposal.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">
                      {proposal.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {proposal.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center gap-3 text-slate-700">
                          <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-lg font-medium">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Reliable Technology
            </h2>
            <p className="text-xl text-slate-600">
              Technical features that guarantee the security and transparency of your data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card 
                key={feature.title} 
                className="border-2 border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 bg-white group"
              >
                <CardHeader className="p-0 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 mt-4">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CardDescription className="text-slate-600 text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="container mx-auto px-4 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-6 drop-shadow-sm">
              Ready to Get Started?
            </h2>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto drop-shadow-sm leading-relaxed">
              Join the revolution of transparent and sustainable agriculture
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-white text-orange-600 hover:bg-white/90 font-bold px-8 py-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 text-lg"
                >
                  View Dashboard
                </Button>
              </Link>
              <Link to="/rastrear">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white/20 font-bold px-8 py-4 rounded-full backdrop-blur-sm hover:scale-105 transition-all duration-300 text-lg"
                >
                  Try Tracking
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              MangoChain
            </span>
          </div>
          <p className="text-slate-600 max-w-md mx-auto">
            © 2024 MangoChain Tracker. Developed for Peruvian farmers with blockchain technology.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;