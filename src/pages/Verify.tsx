import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Package, MapPin, User, Award, Shield, CheckCircle,
    AlertCircle, ArrowLeft, Calendar, Loader2
} from "lucide-react";
import Timeline from "@/components/Timeline";
import { useScanTracking } from "@/hooks/useScanTracking";
import { toast } from "sonner";

const Verify = () => {
    const { batchId } = useParams<{ batchId: string }>();
    const navigate = useNavigate();
    const { logScan } = useScanTracking();
    const [loteData, setLoteData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (batchId) {
            verifyBatch(batchId);
        }
    }, [batchId]);

    const verifyBatch = async (id: string) => {
        setIsLoading(true);

        // Simulate blockchain lookup
        setTimeout(() => {
            const lotes = JSON.parse(localStorage.getItem("lotes") || "[]");
            const lote = lotes.find((l: any) => l.loteId === id);

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
                            icon: Package,
                        },
                        {
                            id: "3",
                            title: "Supermarket - Lima",
                            description: "In distribution",
                            completed: false,
                            icon: MapPin,
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
                setNotFound(false);

                // Log the scan event
                logScan(id, true);

                toast.success(
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-semibold">Batch verified successfully!</span>
                    </div>
                );
            } else {
                setNotFound(true);
                logScan(id, false);
            }

            setIsLoading(false);
        }, 1000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <Card className="w-full max-w-md mx-4 border-2 border-slate-200 rounded-2xl shadow-xl">
                    <CardContent className="py-16 text-center">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                            <Loader2 className="h-10 w-10 text-white animate-spin" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-700 mb-3">
                            Verifying Batch...
                        </h3>
                        <p className="text-slate-600 text-lg">
                            Checking blockchain records
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-2 border-red-200 rounded-2xl shadow-xl bg-gradient-to-br from-red-50 to-orange-50">
                    <CardContent className="py-16 text-center">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                            <AlertCircle className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-red-900 mb-3">
                            Batch Not Found
                        </h3>
                        <p className="text-red-700 text-lg mb-6">
                            The batch ID "{batchId}" was not found on the blockchain.
                        </p>
                        <Button
                            onClick={() => navigate("/rastrear")}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Search Another Batch
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Verified Badge */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl px-6 py-4 shadow-xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="h-7 w-7 text-white" />
                        </div>
                        <div className="text-left">
                            <h1 className="text-2xl md:text-3xl font-black text-green-800">
                                ✓ Verified Authentic
                            </h1>
                            <p className="text-green-700 font-semibold">
                                Blockchain Verified Mango Batch
                            </p>
                        </div>
                    </div>
                </div>

                {/* Batch Information Card */}
                <Card className="mb-8 border-2 border-slate-200 rounded-2xl shadow-xl bg-white">
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-3 text-slate-900 text-2xl">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <Package className="h-6 w-6 text-white" />
                            </div>
                            Batch Details
                        </CardTitle>
                        <CardDescription className="text-slate-600 text-lg">
                            Complete batch information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Batch ID */}
                            <div className="space-y-2 p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border-2 border-blue-200">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <Package className="h-5 w-5" />
                                    <span className="text-sm font-bold uppercase">Batch ID</span>
                                </div>
                                <p className="text-xl font-black text-blue-900 font-mono">{loteData.loteId}</p>
                            </div>

                            {/* Producer */}
                            <div className="space-y-2 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200">
                                <div className="flex items-center gap-2 text-orange-700">
                                    <User className="h-5 w-5" />
                                    <span className="text-sm font-bold uppercase">Producer</span>
                                </div>
                                <p className="text-xl font-black text-orange-900">{loteData.productor}</p>
                            </div>

                            {/* Location */}
                            <div className="space-y-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                                <div className="flex items-center gap-2 text-green-700">
                                    <MapPin className="h-5 w-5" />
                                    <span className="text-sm font-bold uppercase">Origin</span>
                                </div>
                                <p className="text-xl font-black text-green-900">{loteData.ubicacion}, Peru</p>
                            </div>

                            {/* Quality */}
                            <div className="space-y-2 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                                <div className="flex items-center gap-2 text-purple-700">
                                    <Award className="h-5 w-5" />
                                    <span className="text-sm font-bold uppercase">Quality</span>
                                </div>
                                <p className="text-xl font-black text-purple-900">{loteData.calidad}</p>
                            </div>

                            {/* Registration Date */}
                            <div className="space-y-2 p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border-2 border-slate-200 sm:col-span-2">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Calendar className="h-5 w-5" />
                                    <span className="text-sm font-bold uppercase">Registered</span>
                                </div>
                                <p className="text-xl font-black text-slate-900">
                                    {new Date(loteData.timestamp).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Blockchain Verification */}
                        <div className="mt-6 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl">
                            <div className="flex items-center gap-3 mb-3">
                                <Shield className="h-6 w-6 text-emerald-600" />
                                <span className="text-lg font-black text-emerald-900">Blockchain Verified</span>
                            </div>
                            <p className="text-sm text-emerald-700 font-mono break-all bg-white/60 p-3 rounded-xl border border-emerald-200">
                                {loteData.hash}
                            </p>
                            <p className="text-emerald-700 text-sm mt-3 font-bold">
                                🔒 Permanently recorded on {loteData.network}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Supply Chain Timeline */}
                <Card className="border-2 border-slate-200 rounded-2xl shadow-xl bg-white mb-8">
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-3 text-slate-900 text-2xl">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <MapPin className="h-6 w-6 text-white" />
                            </div>
                            Supply Chain Journey
                        </CardTitle>
                        <CardDescription className="text-slate-600 text-lg">
                            Track the batch from farm to consumer
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Timeline steps={loteData.steps} />
                    </CardContent>
                </Card>

                {/* Action Button */}
                <div className="text-center">
                    <Button
                        onClick={() => navigate("/rastrear")}
                        variant="outline"
                        className="border-2 border-slate-300 hover:bg-slate-50 font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Search Another Batch
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Verify;
