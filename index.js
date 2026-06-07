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
        GatewayIntentBits.MessageContent
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

client.login(process.env.TOKEN);
