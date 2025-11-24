import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Copy, CheckCircle, QrCode } from "lucide-react";
import { toast } from "sonner";

interface QRGeneratorProps {
    batchId: string;
    size?: number;
    showDownload?: boolean;
    showCopy?: boolean;
    className?: string;
}

const QRGenerator = ({
    batchId,
    size = 200,
    showDownload = true,
    showCopy = true,
    className = ""
}: QRGeneratorProps) => {
    const [copied, setCopied] = useState(false);
    const verificationUrl = `${window.location.origin}/verify/${batchId}`;

    const handleDownload = () => {
        const svg = document.getElementById(`qr-${batchId}`) as HTMLElement;
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        canvas.width = size + 40;
        canvas.height = size + 40;

        img.onload = () => {
            if (ctx) {
                // White background
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw QR code
                ctx.drawImage(img, 20, 20, size, size);

                // Convert to PNG and download
                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = `qr-${batchId}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();

                toast.success("QR Code downloaded successfully!");
            }
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(verificationUrl);
        setCopied(true);
        toast.success("Verification URL copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className={`border-2 border-slate-200 rounded-2xl shadow-lg ${className}`}>
            <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center gap-2 justify-center text-slate-900">
                    <QrCode className="h-5 w-5 text-orange-500" />
                    QR Code
                </CardTitle>
                <CardDescription className="text-slate-600">
                    Scan to verify batch authenticity
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
                {/* QR Code */}
                <div className="p-4 bg-white rounded-xl border-2 border-slate-200 shadow-md">
                    <QRCodeSVG
                        id={`qr-${batchId}`}
                        value={verificationUrl}
                        size={size}
                        level="H"
                        includeMargin={false}
                    />
                </div>

                {/* Batch ID */}
                <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600 mb-1">Batch ID</p>
                    <p className="text-lg font-bold text-slate-900 font-mono">{batchId}</p>
                </div>

                {/* URL Display */}
                <div className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1 font-semibold">Verification URL</p>
                    <p className="text-sm text-slate-700 break-all font-mono">{verificationUrl}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 w-full">
                    {showDownload && (
                        <Button
                            onClick={handleDownload}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    )}
                    {showCopy && (
                        <Button
                            onClick={handleCopy}
                            variant="outline"
                            className="flex-1 border-2 border-slate-300 hover:bg-slate-50 font-bold rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                        >
                            {copied ? (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy URL
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default QRGenerator;
