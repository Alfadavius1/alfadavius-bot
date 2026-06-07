const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

// === DISCORD CLIENT ===
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});

client.on("clientReady", () => {
    console.log(`Bot je online jako ${client.user.tag}`);
});

// === EXPRESS APP ===
const app = express();

// 🔥 Twitch vyžaduje RAW body pro challenge
app.use("/twitch", bodyParser.raw({ type: "*/*" }));

// Ostatní endpointy normálně JSON
app.use(express.json({ limit: "1mb" }));

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
const TWITCH_USER_ID = "195231723";
const WEBHOOK_URL = process.env.WEBHOOK_URL;

let accessToken = "";

// === TOKEN ===
async function getTwitchToken() {
    const res = await axios.post(
        "https://id.twitch.tv/oauth2/token",
        {
            client_id: TWITCH_CLIENT_ID,
            client_secret: TWITCH_SECRET,
            grant_type: "client_credentials"
        }
    );

    accessToken = res.data.access_token;
    console.log("Twitch token získán:", accessToken);
}

// === SMAZÁNÍ STARÝCH SUBS ===
async function clearEventSubs() {
    const res = await axios.get(
        "https://api.twitch.tv/helix/eventsub/subscriptions",
        {
            headers: {
                "Client-ID": TWITCH_CLIENT_ID,
                "Authorization": `Bearer ${accessToken}`
            }
        }
    );

    for (const sub of res.data.data) {
        await axios.delete(
            `https://api.twitch.tv/helix/eventsub/subscriptions?id=${sub.id}`,
            {
                headers: {
                    "Client-ID": TWITCH_CLIENT_ID,
                    "Authorization": `Bearer ${accessToken}`
                }
            }
        );
        console.log("Smazáno:", sub.id);
    }
}

// === REGISTRACE ===
async function subscribeToStreamOnline() {
    try {
        const body = {
            type: "stream.online",
            version: "1",
            condition: { broadcaster_user_id: TWITCH_USER_ID },
            transport: {
                method: "webhook",
                callback: `${WEBHOOK_URL}/twitch`,
                secret: "vexru_secret"
            }
        };

        console.log("Odesílám EventSub registraci:", body);

        await axios.post(
            "https://api.twitch.tv/helix/eventsub/subscriptions",
            body,
            {
                headers: {
                    "Client-ID": TWITCH_CLIENT_ID,
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("Twitch EventSub přihlášen (stream.online).");

    } catch (err) {
        console.log("❌ CHYBA PŘI REGISTRACI EVENTSUB:");
        console.log("STATUS:", err.response?.status);
        console.log("DATA:", err.response?.data);
        console.log("MESSAGE:", err.message);
    }
}

// === TWITCH WEBHOOK ===
app.post("/twitch", (req, res) => {
    const messageType = req.headers["twitch-eventsub-message-type"];

    // RAW body → musíme ho převést na JSON
    let body = {};
    try {
        body = JSON.parse(req.body.toString("utf8"));
    } catch (e) {
        console.log("❌ Twitch poslal nevalidní JSON:", e);
    }

    console.log("📨 RAW Twitch request:", JSON.stringify(body, null, 2));

    // Challenge
    if (messageType === "webhook_callback_verification") {
        console.log("Twitch poslal challenge.");
        return res.status(200).send(body.challenge);
    }

    // Notifikace
    if (messageType === "notification") {
        const event = body.event;

        console.log("📩 Twitch poslal notifikaci:", event);

        if (event.type === "stream.online") {
            console.log("Twitch poslal stream.online událost.");

            const guild = client.guilds.cache.first();
            const channel = guild.channels.cache.find(ch => ch.name.includes("live-stream"));

            if (channel) {
                channel.send(
                    `🚀 **${event.broadcaster_user_name} je právě LIVE!**  
Připoj se: https://twitch.tv/${event.broadcaster_user_login}`
                );
            }
        }
    }

    return res.sendStatus(200);
});

// === START ===
const PORT = process.env.PORT || 8080;

app.listen(PORT, async () => {
    console.log("Twitch webhook server běží na portu " + PORT);
    await getTwitchToken();
    await clearEventSubs();
    await subscribeToStreamOnline();
});

// === DISCORD LOGIN ===
client.login(process.env.TOKEN);
