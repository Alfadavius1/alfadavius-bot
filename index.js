const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");
require("dotenv").config();
const express = require("express");
const axios = require("axios");

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

// === READY EVENT ===
client.on("ready", () => {
    console.log(`Bot je online jako ${client.user.tag}`);
});


// === WELCOME ZPRÁVA ===
client.on("guildMemberAdd", async (member) => {
    try {
        const channel = member.guild.channels.cache.find(
            ch => ch.name.includes("pravidla") || ch.name.includes("welcome")
        );

        if (!channel) return console.log("Welcome kanál nenalezen.");

        const embed = new EmbedBuilder()
            .setColor("#0a84ff")
            .setTitle("🛸 Nový člen posádky na palubě!")
            .setDescription(
`Vítej, **${member}**.

Senzory zaznamenaly nový životní signál a identifikace byla úspěšně dokončena.

👨‍🚀 Status: Přijat do posádky  
🚀 Loď: Vexru Command Vessel  
🛰️ Mise: Průzkum, komunikace a přežití v neznámém sektoru

Před vstupem do hlavního modulu si prosím prostuduj provozní protokol v kanálu #pravidla.

Ať tě hvězdy vedou, kadete.`
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: "Vexru Command • Galactic Entry Protocol" })
            .setTimestamp();

        channel.send({ embeds: [embed] });

    } catch (err) {
        console.error("Chyba welcome zprávy:", err);
    }
});


// ======================================================
// === TWITCH STREAM OZNÁMENÍ (EventSub Webhook) ===
// ======================================================

const app = express();
app.use(express.json());

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
const TWITCH_USER_ID = process.env.TWITCH_USER_ID; // tvoje Twitch ID
const WEBHOOK_URL = process.env.WEBHOOK_URL; // Railway URL

let accessToken = "";

// === ZÍSKÁNÍ TWITCH TOKENU ===
async function getTwitchToken() {
    const res = await axios.post(
        `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_SECRET}&grant_type=client_credentials`
    );
    accessToken = res.data.access_token;
    console.log("Twitch token získán.");
}

// === REGISTRACE EVENTSUB ===
async function subscribeToStreamOnline() {
    await axios.post(
        "https://api.twitch.tv/helix/eventsub/subscriptions",
        {
            type: "stream.online",
            version: "1",
            condition: { broadcaster_user_id: TWITCH_USER_ID },
            transport: {
                method: "webhook",
                callback: `${WEBHOOK_URL}/twitch`,
                secret: "vexru_secret"
            }
        },
        {
            headers: {
                "Client-ID": TWITCH_CLIENT_ID,
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        }
    );

    console.log("Twitch EventSub přihlášen.");
}

// === TWITCH WEBHOOK ENDPOINT ===
app.post("/twitch", async (req, res) => {
    const messageType = req.headers["twitch-eventsub-message-type"];

    // Ověření webhooku
    if (messageType === "webhook_callback_verification") {
        return res.status(200).send(req.body.challenge);
    }

    // Notifikace o streamu
    if (messageType === "notification") {
        const event = req.body.event;

        if (event.type === "live") {
            const guild = client.guilds.cache.first();
            const channel = guild.channels.cache.find(ch => ch.name.includes("oznámení"));

            if (channel) {
                channel.send(
                    `🚀 **${event.broadcaster_user_name} právě začal streamovat na Twitchi!**  
Připoj se: https://twitch.tv/${event.broadcaster_user_login}`
                );
            }
        }
    }

    res.sendStatus(200);
});

// === SPUŠTĚNÍ WEBHOOK SERVERU ===
app.listen(3000, async () => {
    console.log("Twitch webhook server běží na portu 3000");
    await getTwitchToken();
    await subscribeToStreamOnline();
});


// === DISCORD LOGIN ===
client.login(process.env.TOKEN);
