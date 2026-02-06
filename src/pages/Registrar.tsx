import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Wallet, MapPin, User, Barcode, Sparkles, Shield, Zap, CheckCircle, ArrowRight, Gem, Star, Award, Leaf } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useMetaMask } from "@/hooks/useMetaMask";
import QRGenerator from "@/components/QRGenerator";
import { VARIETY_OPTIONS, getVarietyById } from "@/constants/mangoVarieties";
import { useTranslation } from "@/config/i18n";
import { saveBatchToDatabase, testSupabaseConnection } from "@/services/batchService";
import type { BatchRecord } from "@/services/batchService";

const Registrar = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { isConnected, connectWallet, formatAddress, account } = useMetaMask();
  const lang: 'es' | 'en' = 'es';
  const i18n = useTranslation(lang);

  const [formData, setFormData] = useState({
    loteId: "",
    productor: "",
    ubicacion: "Piura",
    variedad: "",
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

    if (!formData.loteId || !formData.productor || !formData.calidad || !formData.variedad) {
      toast.error(i18n.registrar.selectVariety);
      return;
    }

    const varietyInfo = getVarietyById(formData.variedad);
    if (!varietyInfo) {
      toast.error(i18n.registrar.varietyRequired);
      return;
    }

    setIsLoading(true);

    try {
      // Generar hash de transacción simulado
      const mockHash = `0x${Math.random().toString(16).substring(2, 42)}`;

      // Preparar datos para guardar en Supabase
      const batchData: BatchRecord = {
        batch_id: formData.loteId,
        producer_name: formData.productor,
        location: formData.ubicacion,
        variety: varietyInfo.name,
        quality: formData.calidad,
        transaction_hash: mockHash,
        wallet_address: account || undefined,
        metadata: {
          varietyId: formData.variedad,
          timestamp: new Date().toISOString(),
          network: "Polygon Amoy",
          emoji: varietyInfo.emoji,
        },
      };

      // Guardar en Supabase
      const supabaseResult = await saveBatchToDatabase(batchData);

      if (supabaseResult.success) {
        toast.success(
          <div className="space-y-2 p-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-bold text-lg">{i18n.registrar.registrationSuccess}</span>
            </div>
            <p className="text-sm text-slate-600">Transaction: {mockHash.slice(0, 20)}...</p>
            <p className="text-sm text-slate-600">Variety: {varietyInfo.name}</p>
            <p className="text-xs text-green-600">✓ Guardado en BD</p>
          </div>
        );

        // También guardar en localStorage como backup
        const lotes = JSON.parse(localStorage.getItem("lotes") || "[]");
        const newLote = {
          loteId: formData.loteId,
          productor: formData.productor,
          ubicacion: formData.ubicacion,
          variedad: formData.variedad,
          varietyName: varietyInfo.name,
          calidad: formData.calidad,
          hash: mockHash,
          timestamp: new Date().toISOString(),
          network: "Polygon Amoy",
        };
        lotes.push(newLote);
        localStorage.setItem("lotes", JSON.stringify(lotes));
      }

      setIsLoading(false);
      setRegistrationSuccess(true);
    } catch (error) {
      console.error("Error during registration:", error);
      toast.error("Error al registrar el lote");
      setIsLoading(false);
    }
  };

  const handleTrackBatch = () => {
    navigate(`/rastrear?lote=${formData.loteId}`);
  };

  const handleRegisterAnother = () => {
    setRegistrationSuccess(false);
    setFormData({
      loteId: "",
      productor: "",
      ubicacion: "Piura",
      variedad: "",
      calidad: "",
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/30">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl border border-slate-200 mb-6">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Sparkles className="h-7 w-7 text-white" />
              </motion.div>
              <div className="text-left">
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  {i18n.registrar.title}
                </h1>
                <p className="text-slate-600 text-lg">
                  {i18n.registrar.subtitle}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="space-y-8">
              {registrationSuccess ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="border-2 border-green-200 rounded-2xl shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader className="pb-6">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                          className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg"
                        >
                          <CheckCircle className="h-8 w-8 text-white" />
                        </motion.div>
                        <div>
                          <CardTitle className="text-3xl font-black text-green-900">
                            {i18n.registrar.registrationSuccess}
                          </CardTitle>
                          <CardDescription className="text-green-700 text-lg">
                            {i18n.registrar.batchRegistered}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Variedad Info */}
                      {formData.variedad && (
                        <div className="p-6 bg-white/80 rounded-2xl border-2 border-green-200">
                          <p className="text-sm font-semibold text-green-800 mb-3">Variedad Registrada</p>
                          <div className="flex items-center gap-4">
                            <div className="text-3xl">{getVarietyById(formData.variedad)?.emoji}</div>
                            <div>
                              <p className="font-bold text-lg text-slate-900">{getVarietyById(formData.variedad)?.name}</p>
                              <p className="text-sm text-slate-600">{getVarietyById(formData.variedad)?.description}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* QR Code */}
                      <div className="p-6 bg-white/80 rounded-2xl border-2 border-green-200">
                        <p className="text-sm font-semibold text-green-800 mb-4">Batch QR Code</p>
                        <QRGenerator batchId={formData.loteId} />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={handleTrackBatch}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                          size="lg"
                        >
                          <ArrowRight className="mr-2 h-5 w-5" />
                          {i18n.registrar.trackBatch}
                        </Button>
                        <Button
                          onClick={handleRegisterAnother}
                          variant="outline"
                          className="flex-1 border-2 border-green-300 text-green-700 hover:bg-green-50 font-bold py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                          size="lg"
                        >
                          {i18n.registrar.registerAnother}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <>
                  {/* Wallet Connection Status */}
                  {!isConnected ? (
                    <motion.div variants={itemVariants}>
                      <Card className="border-2 border-amber-200 rounded-2xl shadow-xl bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-2xl transition-all duration-300">
                        <CardContent className="pt-8 text-center">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-6"
                          >
                            <Wallet className="h-10 w-10 text-white" />
                          </motion.div>
                          <h3 className="text-2xl font-bold text-amber-900 mb-3">
                            {i18n.registrar.walletNotConnected}
                          </h3>
                          <p className="text-amber-700 mb-6 text-lg leading-relaxed">
                            {i18n.registrar.connectWalletMessage}
                          </p>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={handleConnectWallet}
                              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-8 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 text-lg"
                              size="lg"
                            >
                              <Wallet className="mr-3 h-5 w-5" />
                              {i18n.registrar.connectWallet}
                            </Button>
                          </motion.div>
                          <div className="mt-6 p-4 bg-blue-50/80 border-2 border-blue-200 rounded-2xl backdrop-blur-sm">
                            <p className="text-blue-800 font-semibold text-sm">
                              <strong>{i18n.registrar.requiredNetwork}:</strong> Polygon Amoy Testnet (Chain ID: 80002)
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <>
                      {/* Wallet Connected Info */}
                      <motion.div
                        variants={itemVariants}
                        className="mb-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-emerald-800 font-bold text-lg flex items-center gap-2">
                              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                              ✅ {i18n.registrar.walletConnected}
                            </p>
                            <p className="text-emerald-700 font-mono text-sm mt-1">
                              {formatAddress(account)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-emerald-600 text-sm font-semibold">
                              {i18n.registrar.polygonAmoy}
                            </p>
                            <p className="text-emerald-500 text-xs">Chain ID: 80002</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Registration Form */}
                      <motion.div variants={itemVariants}>
                        <Card className="border-2 border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
                          <CardHeader className="pb-6">
                            <CardTitle className="flex items-center gap-3 text-slate-900 text-2xl">
                              <motion.div
                                whileHover={{ rotate: 180 }}
                                transition={{ duration: 0.3 }}
                                className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg"
                              >
                                <Shield className="h-6 w-6 text-white" />
                              </motion.div>
                              {i18n.registrar.formTitle}
                            </CardTitle>
                            <CardDescription className="text-slate-600 text-lg">
                              {i18n.registrar.formDescription}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                              {/* Batch ID Field */}
                              <motion.div
                                whileHover={{ scale: 1.01 }}
                                className="space-y-3"
                              >
                                <Label htmlFor="loteId" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                                  <Barcode className="h-5 w-5 text-orange-500" />
                                  {i18n.registrar.batchId} *
                                </Label>
                                <Input
                                  id="loteId"
                                  placeholder={i18n.registrar.batchIdPlaceholder}
                                  value={formData.loteId}
                                  onChange={(e) => setFormData({ ...formData, loteId: e.target.value })}
                                  className="border-2 border-slate-200 rounded-xl px-4 py-3 text-lg hover:border-orange-300 focus:border-orange-500 transition-all duration-200 focus:ring-2 focus:ring-orange-200"
                                  required
                                />
                              </motion.div>

                              {/* Producer Field */}
                              <motion.div
                                whileHover={{ scale: 1.01 }}
                                className="space-y-3"
                              >
                                <Label htmlFor="productor" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                                  <User className="h-5 w-5 text-orange-500" />
                                  {i18n.registrar.producerName} *
                                </Label>
                                <Input
                                  id="productor"
                                  placeholder={i18n.registrar.producerNamePlaceholder}
                                  value={formData.productor}
                                  onChange={(e) => setFormData({ ...formData, productor: e.target.value })}
                                  className="border-2 border-slate-200 rounded-xl px-4 py-3 text-lg hover:border-orange-300 focus:border-orange-500 transition-all duration-200 focus:ring-2 focus:ring-orange-200"
                                  required
                                />
                              </motion.div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Location Field */}
                                <motion.div
                                  whileHover={{ scale: 1.01 }}
                                  className="space-y-3"
                                >
                                  <Label htmlFor="ubicacion" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-orange-500" />
                                    {i18n.registrar.location}
                                  </Label>
                                  <Select
                                    value={formData.ubicacion}
                                    onValueChange={(value) => setFormData({ ...formData, ubicacion: value })}
                                  >
                                    <SelectTrigger className="border-2 border-slate-200 rounded-xl px-4 py-3 text-lg hover:border-orange-300 focus:border-orange-500 transition-all duration-200">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-2 border-slate-200">
                                      <SelectItem value="Piura" className="text-lg py-3 cursor-pointer hover:bg-orange-50">{i18n.registrar.piura}</SelectItem>
                                      <SelectItem value="Lambayeque" className="text-lg py-3 cursor-pointer hover:bg-orange-50">{i18n.registrar.lambayeque}</SelectItem>
                                      <SelectItem value="Ica" className="text-lg py-3 cursor-pointer hover:bg-orange-50">{i18n.registrar.ica}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </motion.div>

                                {/* Quality Field */}
                                <motion.div
                                  whileHover={{ scale: 1.01 }}
                                  className="space-y-3"
                                >
                                  <Label htmlFor="calidad" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                                    <Gem className="h-5 w-5 text-orange-500" />
                                    {i18n.registrar.qualityGrade} *
                                  </Label>
                                  <Select
                                    value={formData.calidad}
                                    onValueChange={(value) => setFormData({ ...formData, calidad: value })}
                                  >
                                    <SelectTrigger className="border-2 border-slate-200 rounded-xl px-4 py-3 text-lg hover:border-orange-300 focus:border-orange-500 transition-all duration-200">
                                      <SelectValue placeholder={i18n.registrar.qualityPlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-2 border-slate-200">
                                      <SelectItem value="Premium" className="text-lg py-3 cursor-pointer hover:bg-green-50">
                                        <div className="flex items-center gap-2">
                                          <Star className="h-4 w-4 text-green-500" />
                                          {i18n.registrar.premium}
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Export" className="text-lg py-3 cursor-pointer hover:bg-blue-50">
                                        <div className="flex items-center gap-2">
                                          <Gem className="h-4 w-4 text-blue-500" />
                                          {i18n.registrar.export}
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="First Grade" className="text-lg py-3 cursor-pointer hover:bg-yellow-50">
                                        <div className="flex items-center gap-2">
                                          <Award className="h-4 w-4 text-yellow-500" />
                                          {i18n.registrar.firstGrade}
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Second Grade" className="text-lg py-3 cursor-pointer hover:bg-slate-50">
                                        <div className="flex items-center gap-2">
                                          <Award className="h-4 w-4 text-slate-500" />
                                          {i18n.registrar.secondGrade}
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </motion.div>
                              </div>

                              {/* Variety Field - NEW */}
                              <motion.div
                                whileHover={{ scale: 1.01 }}
                                className="space-y-3"
                              >
                                <Label htmlFor="variedad" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                                  <Leaf className="h-5 w-5 text-green-600" />
                                  {i18n.registrar.variety} *
                                </Label>
                                <Select
                                  value={formData.variedad}
                                  onValueChange={(value) => setFormData({ ...formData, variedad: value })}
                                >
                                  <SelectTrigger className="border-2 border-slate-200 rounded-xl px-4 py-3 text-lg hover:border-orange-300 focus:border-orange-500 transition-all duration-200">
                                    <SelectValue placeholder={i18n.registrar.varietyPlaceholder} />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl border-2 border-slate-200 max-h-96">
                                    {VARIETY_OPTIONS.map((variety) => (
                                      <SelectItem
                                        key={variety.value}
                                        value={variety.value}
                                        className="text-lg py-3 cursor-pointer hover:bg-orange-50"
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="text-2xl">{variety.emoji}</span>
                                          <div className="text-left">
                                            <p className="font-bold">{variety.label}</p>
                                            <p className="text-xs text-slate-600">{variety.description}</p>
                                          </div>
                                          {variety.exportable && (
                                            <span className="text-xs font-semibold text-blue-600 ml-2">Export</span>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {/* Variety Preview */}
                                {formData.variedad && getVarietyById(formData.variedad) && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-3xl">{getVarietyById(formData.variedad)?.emoji}</span>
                                      <div>
                                        <p className="font-bold text-slate-900">{getVarietyById(formData.variedad)?.name}</p>
                                        <p className="text-sm text-slate-600">{getVarietyById(formData.variedad)?.description}</p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </motion.div>

                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Button
                                  type="submit"
                                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 text-lg mt-6 relative overflow-hidden group"
                                  disabled={isLoading}
                                  size="lg"
                                >
                                  <span className="relative z-10 flex items-center justify-center">
                                    {isLoading ? (
                                      <>
                                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                        {i18n.registrar.registering}
                                      </>
                                    ) : (
                                      <>
                                        <Zap className="mr-3 h-5 w-5" />
                                        {i18n.registrar.register}
                                      </>
                                    )}
                                  </span>
                                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                                </Button>
                              </motion.div>
                            </form>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* Info Note */}
                      <motion.div
                        variants={itemVariants}
                        className="mt-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200 rounded-2xl shadow-lg"
                      >
                        <p className="text-slate-700 text-lg leading-relaxed">
                          <strong>{i18n.registrar.note}:</strong> {i18n.registrar.noteMessage}
                        </p>
                        <p className="text-slate-600 text-sm mt-3 font-semibold">
                          <strong>{i18n.registrar.network}:</strong> Polygon Amoy Testnet (Chain ID: 80002)
                        </p>
                      </motion.div>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Registrar;