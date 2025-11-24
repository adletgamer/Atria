import QRGenerator from "@/components/QRGenerator";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Simple test page to demonstrate QR code functionality
const QRTest = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-4">
            🎉 QR Code System Working!
          </h1>
          <p className="text-slate-600 text-lg">
            Scan these QR codes with your phone to verify batches
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Example 1 */}
          <QRGenerator batchId="MG-2024-001" />

          {/* Example 2 */}
          <QRGenerator batchId="MG-2024-QR-TEST" size={250} />
        </div>

        <Card className="max-w-2xl mx-auto mt-12 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">📱 How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-slate-700">
              <li className="font-semibold">
                Scan the QR code with your phone camera
              </li>
              <li className="font-semibold">
                Or click "Download" to save the QR code as PNG
              </li>
              <li className="font-semibold">
                The QR links to: <code className="bg-slate-100 px-2 py-1 rounded text-sm">/verify/[batchId]</code>
              </li>
              <li className="font-semibold">
                Try visiting: <a href="/verify/MG-2024-001" className="text-orange-600 underline hover:text-orange-700">/verify/MG-2024-001</a>
              </li>
              <li className="font-semibold">
                Each scan is automatically tracked! Check console: <code className="bg-slate-100 px-2 py-1 rounded text-sm">localStorage.getItem('mango_scan_events')</code>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QRTest;
