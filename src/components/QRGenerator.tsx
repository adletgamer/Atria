import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Copy, CheckCircle, QrCode, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";

interface QRGeneratorProps {
    batchId: string;
    size?: number;
    showDownload?: boolean;
    showCopy?: boolean;
    showShare?: boolean;
    className?: string;
    bgColor?: string;
    fgColor?: string;
    onDataChange?: (qrData: QRDataExport) => void;
}

export interface QRDataExport {
    batchId: string;
    verificationUrl: string;
    timestamp: string;
    qrSize: number;
}

const QRGenerator = ({
    batchId,
    size = 200,
    showDownload = true,
    showCopy = true,
    showShare = false,
    className = "",
    bgColor = "#ffffff",
    fgColor = "#000000",
    onDataChange
}: QRGeneratorProps) => {
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);
    const verificationUrl = `${window.location.origin}/verify-pack?lote=${encodeURIComponent(batchId)}`;

    // Exportar datos del QR
    const qrData: QRDataExport = {
        batchId,
        verificationUrl,
        timestamp: new Date().toISOString(),
        qrSize: size
    };

    // Actualizar datos cuando cambia el QR
    if (onDataChange) {
        onDataChange(qrData);
    }

    /**
     * Descarga el QR como PNG con mejor calidad
     */
    const handleDownloadPNG = async () => {
        try {
            setIsGenerating(true);
            const svg = document.getElementById(`qr-${batchId}`) as HTMLElement;
            if (!svg) {
                toast.error("No se encontró el código QR");
                return;
            }

            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            const padding = 40;
            canvas.width = size + padding;
            canvas.height = size + padding;

            img.onload = () => {
                if (ctx) {
                    // Fondo blanco
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Dibujar QR
                    ctx.drawImage(img, padding / 2, padding / 2, size, size);

                    // Descargar PNG
                    const pngFile = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.download = `qr-${batchId}-${Date.now()}.png`;
                    link.href = pngFile;
                    link.click();

                    toast.success("✓ QR descargado como PNG");
                    setIsGenerating(false);
                }
            };

            img.onerror = () => {
                toast.error("Error al procesar la imagen");
                setIsGenerating(false);
            };

            img.src = "data:image/svg+xml;base64," + btoa(svgData);
        } catch (error) {
            console.error("Error downloading QR:", error);
            toast.error("Error al descargar el QR");
            setIsGenerating(false);
        }
    };

    /**
     * Descarga el QR como SVG (resolución infinita)
     */
    const handleDownloadSVG = () => {
        try {
            const svg = document.getElementById(`qr-${batchId}`) as HTMLElement;
            if (!svg) {
                toast.error("No se encontró el código QR");
                return;
            }

            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `qr-${batchId}-${Date.now()}.svg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);

            toast.success("✓ QR descargado como SVG");
        } catch (error) {
            console.error("Error downloading SVG:", error);
            toast.error("Error al descargar el SVG");
        }
    };

    /**
     * Copia la URL al portapapeles
     */
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(verificationUrl);
            setCopied(true);
            toast.success("✓ URL copiada al portapapeles");
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Error copying:", error);
            toast.error("Error al copiar");
        }
    };

    /**
     * Copia el Batch ID
     */
    const handleCopyBatchId = async () => {
        try {
            await navigator.clipboard.writeText(batchId);
            toast.success("✓ Batch ID copiado");
        } catch (error) {
            console.error("Error copying batch ID:", error);
            toast.error("Error al copiar el Batch ID");
        }
    };

    /**
     * Comparte el QR (Web Share API)
     */
    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `MangoChain - Batch ${batchId}`,
                    text: `Verifica la autenticidad de este lote de mango`,
                    url: verificationUrl,
                });
                toast.success("✓ Compartido exitosamente");
            } else {
                // Fallback: copiar URL
                await navigator.clipboard.writeText(verificationUrl);
                toast.success("✓ URL copiada (sin soporte de compartir)");
            }
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    return (
        <Card className={`border-2 border-slate-200 rounded-2xl shadow-lg ${className}`}>
            <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center gap-2 justify-center text-slate-900">
                    <QrCode className="h-5 w-5 text-orange-500" />
                    Código QR de Verificación
                </CardTitle>
                <CardDescription className="text-slate-600">
                    Escanea para verificar la autenticidad del lote
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
                {/* QR Code Container */}
                <div 
                    ref={qrRef}
                    className="p-4 bg-white rounded-xl border-2 border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                    <QRCodeSVG
                        id={`qr-${batchId}`}
                        value={verificationUrl}
                        size={size}
                        level="H"
                        includeMargin={true}
                        bgColor={bgColor}
                        fgColor={fgColor}
                    />
                </div>

                {/* Información del Batch */}
                <div className="w-full space-y-3">
                    {/* Batch ID */}
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-xl border border-orange-200">
                        <p className="text-xs font-semibold text-slate-600 mb-1">ID del Lote</p>
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-mono font-bold text-slate-900 break-all">{batchId}</p>
                            <button
                                onClick={handleCopyBatchId}
                                className="p-1 hover:bg-white rounded transition-colors"
                                title="Copiar ID"
                            >
                                <Copy className="h-4 w-4 text-orange-600" />
                            </button>
                        </div>
                    </div>

                    {/* Verification URL */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
                        <p className="text-xs text-slate-600 mb-1 font-semibold">URL de Verificación</p>
                        <p className="text-xs text-slate-700 break-all font-mono text-slate-600">
                            {verificationUrl}
                        </p>
                    </div>

                    {/* Metadata */}
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-600 font-semibold">Generado: {new Date(qrData.timestamp).toLocaleString()}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 w-full">
                    {showDownload && (
                        <>
                            <Button
                                onClick={handleDownloadPNG}
                                disabled={isGenerating}
                                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Procesando
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        PNG
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleDownloadSVG}
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                SVG
                            </Button>
                        </>
                    )}
                    {showCopy && (
                        <Button
                            onClick={handleCopy}
                            variant="outline"
                            className="border-2 border-slate-300 hover:bg-slate-50 font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                        >
                            {copied ? (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    Copiado
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-4 w-4" />
                                    URL
                                </>
                            )}
                        </Button>
                    )}
                    {showShare && (
                        <Button
                            onClick={handleShare}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <Share2 className="mr-2 h-4 w-4" />
                            Compartir
                        </Button>
                    )}
                </div>

                {/* Info Banner */}
                <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <p className="text-xs text-blue-700">
                        💡 <strong>Consejo:</strong> Descarga como PNG para impresión estándar, o como SVG para alta resolución.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default QRGenerator;
