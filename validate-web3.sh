#!/bin/bash
# Script de validación para la configuración Web3 de MangoChain

echo "🔍 Validando configuración Web3 de MangoChain..."
echo "=================================================="
echo ""

# Verificar archivos creados
echo "📁 Archivos de Configuración:"
files=(
  "src/config/wagmi.ts"
  ".env.example"
  "WEB3_CONFIG_GUIDE.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file - Existente"
  else
    echo "❌ $file - Falta"
  fi
done

echo ""
echo "📦 Dependencias Web3:"
echo "---"
npm list wagmi viem @rainbow-me/rainbowkit 2>/dev/null | grep -E "wagmi|viem|rainbowkit"

echo ""
echo "🔐 Verificación de Seguridad:"
echo "---"

# Verificar que no hay private keys en .env
if grep -q "PRIVATE_KEY" .env 2>/dev/null; then
  echo "⚠️  Advertencia: Private key encontrada en .env"
  echo "   Mueve esto a .env.local (que está en .gitignore)"
else
  echo "✅ No hay private keys en .env"
fi

# Verificar que .gitignore incluye .env.local
if grep -q "\.env\.local" .gitignore 2>/dev/null; then
  echo "✅ .env.local está en .gitignore"
else
  echo "⚠️  Advertencia: .env.local podría no estar en .gitignore"
fi

echo ""
echo "🌐 Configuración de Red:"
echo "---"
echo "Chain: Polygon Amoy Testnet"
echo "Chain ID: 80002 (0x13882)"
echo "RPC: https://rpc-amoy.polygon.technology"
echo "Explorer: https://amoy.polygonscan.com/"

echo ""
echo "✅ Validación completada"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Crear/actualizar .env.local con variables sensibles"
echo "2. Ejecutar: npm run dev"
echo "3. Instalar MetaMask (si no lo tienes)"
echo "4. Cambiar a Polygon Amoy Testnet en MetaMask"
echo "5. Obtener MATIC de testnet desde el faucet"
echo ""
