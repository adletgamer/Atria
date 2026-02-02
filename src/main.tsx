import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import '@rainbow-me/rainbowkit/styles.css';
import { initializeEthereumProvider } from "@/config/ethereumProvider";

// Inicializar Ethereum provider ANTES de cualquier otra cosa
// Esto evita conflictos entre múltiples extensiones de wallet
initializeEthereumProvider();

createRoot(document.getElementById("root")!).render(<App />);
