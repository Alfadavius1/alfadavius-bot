const {
    Client,
    GatewayIntentBits
} = require("discord.js");
require("dotenv").config();
const http = require("http");
const axios = require("axios");

// === DISCORD CLIENT ===
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on("clientReady", () => {
    console.log(`Bot je online jako ${client.user.tag}`);
});

// === TWITCH CONFIG ===
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

// === REGISTRACE EVENTSUB ===
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
        console.log(err.response?.data);
    }
}

// === ČISTÝ NODE SERVER ===
const server = http.createServer(async (req, res) => {
    if (req.method === "POST" && req.url === "/twitch") {
        let rawBody = Buffer.alloc(0);

        req.on("data", chunk => {
            rawBody = Buffer.concat([rawBody, chunk]);
        });

        req.on("end", () => {
            const text = rawBody.toString("utf8");

            console.log("📨 RAW Twitch request:", text);

            const messageType = req.headers["twitch-eventsub-message-type"];

            // === CHALLENGE ===
            if (messageType === "webhook_callback_verification") {
                console.log("Twitch poslal challenge.");

                const match = text.match(/"challenge"\s*:\s*"([^"]+)"/);
                const challenge = match ? match[1] : null;

                res.writeHead(200, { "Content-Type": "text/plain" });
                return res.end(challenge || "");
            }

            // === NOTIFIKACE ===
            if (messageType === "notification") {
                console.log("📩 Twitch poslal notifikaci.");

                // Tady už JSON parsovat můžeme, protože notifikace nejsou rozbité
                try {
                    const body = JSON.parse(text);
                    const event = body.event;

                    if (event?.type === "stream.online") {
                        const guild = client.guilds.cache.first();
                        const channel = guild.channels.cache.find(ch => ch.name.includes("live-stream"));

                        if (channel) {
                            channel.send(
                                `🚀 **${event.broadcaster_user_name} je právě LIVE!**  
https://twitch.tv/${event.broadcaster_user_login}`
                            );
                        }
                    }
                } catch (e) {
                    console.log("❌ Chyba parsování notifikace:", e);
                }
            }

            res.writeHead(200);
            res.end();
        });
    } else {
        res.writeHead(200);
        res.end("OK");
    }
});

// === START SERVERU ===
const PORT = process.env.PORT || 8080;

server.listen(PORT, async () => {
    console.log("Twitch webhook server běží na portu " + PORT);
    await getTwitchToken();
    await clearEventSubs();
    await subscribeToStreamOnline();
});

// === DISCORD LOGIN ===
client.login(process.env.TOKEN);
