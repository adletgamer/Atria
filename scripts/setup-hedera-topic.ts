import { 
    Client, 
    TopicCreateTransaction, 
    PrivateKey 
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    // 1. Configurar el cliente de la Testnet
    const operatorId = process.env.VITE_HEDERA_OPERATOR_ID;
    const operatorKey = process.env.VITE_HEDERA_OPERATOR_KEY;

    if (!operatorId || !operatorKey) {
        throw new Error("Faltan credenciales en el .env");
    }

    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    console.log("🚀 Creando Topic en Hedera Testnet...");

    // 2. Crear la transacción para el nuevo Topic
    const transaction = new TopicCreateTransaction()
        .setTopicMemo("AQRA - MangoChain Production Audit Log");

    // 3. Enviar a la red
    const response = await transaction.execute(client);
    
    // 4. Obtener el recibo con el nuevo ID
    const receipt = await response.getReceipt(client);
    const newTopicId = receipt.topicId;

    console.log("--------------------------------------");
    console.log(`✅ TOPIC CREADO CON ÉXITO: ${newTopicId}`);
    console.log("--------------------------------------");
    console.log("👉 COPIA ESTE ID Y PÉGALO EN TU .ENV:");
    console.log(`VITE_HEDERA_TOPIC_ID="${newTopicId}"`);
    console.log("--------------------------------------");

    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Error creando el topic:", err);
    process.exit(1);
});