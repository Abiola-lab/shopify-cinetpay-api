require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// ✅ Route pour tester si l'API fonctionne
app.get("/", (req, res) => {
    res.send("API Shopify-CinetPay en ligne 🚀");
});

// ✅ Route GET pour afficher un message si l'utilisateur tente d'accéder à /create-payment dans le navigateur
app.get("/create-payment", (req, res) => {
    res.status(405).json({ error: "Méthode non autorisée. Utilisez une requête POST pour créer un paiement." });
});

// 📌 Route POST pour générer un lien de paiement avec CinetPay
app.post("/create-payment", async (req, res) => {
    try {
        // 🔹 Récupérer les infos envoyées par Shopify
        const { transaction_id, amount, currency, description } = req.body;

        if (!transaction_id || !amount || !currency) {
            return res.status(400).json({ error: "Données manquantes" });
        }

        // 🔹 Préparer les données pour l'API CinetPay
        const payload = {
            apikey: process.env.CINETPAY_API_KEY, // Clé API depuis .env
            site_id: process.env.CINETPAY_SITE_ID, // Site ID depuis .env
            transaction_id: transaction_id,
            amount: amount,
            currency: currency,
            description: description,
            return_url: "https://votre-boutique.com/paiement-reussi",
            notify_url: "https://votre-boutique.com/webhook-cinetpay",
            channels: "ALL"
        };

        // 🔹 Appeler l'API CinetPay
        const response = await axios.post("https://api-checkout.cinetpay.com/v2/payment", payload, {
            headers: { "Content-Type": "application/json" }
        });

        // 🔹 Vérifier la réponse
        if (response.data.code === "201") {
            return res.json({ payment_url: response.data.data.payment_url });
        } else {
            return res.status(500).json({ error: "Erreur avec CinetPay", details: response.data });
        }

    } catch (error) {
        console.error("❌ Erreur API CinetPay :", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// ✅ Lancer le serveur
app.listen(PORT, () => {
    console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`);
});