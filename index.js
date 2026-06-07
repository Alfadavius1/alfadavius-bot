const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");
require("dotenv").config();

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

// === OZNÁMENÍ O STREAMU ===
client.on("presenceUpdate", async (oldPresence, newPresence) => {
    try {
        const member = newPresence.member;

        // Sem vlož své Discord ID
        const STREAMER_ID = "TVŮJ_DISCORD_ID";

        if (member.id !== STREAMER_ID) return;

        const wasStreaming = oldPresence?.activities?.some(a => a.type === 1);
        const isStreaming = newPresence?.activities?.some(a => a.type === 1);

        if (!wasStreaming && isStreaming) {
            const channel = member.guild.channels.cache.find(
                ch => ch.name.includes("oznámení") || ch.name.includes("announce")
            );

            if (!channel) return console.log("Oznamovací kanál nenalezen.");

            channel.send(
                `🚀 **${member.user.username} právě zahájil živé vysílání!**  
Připoj se ke streamu a podpoř posádku!`
            );
        }

    } catch (err) {
        console.error("Chyba stream oznámení:", err);
    }
});

client.login(process.env.TOKEN);
