const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once("ready", async () => {
    console.log(`Setup spuštěn jako ${client.user.tag}`);

    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);

        // ROLE
        const rolesToCreate = [
            { name: "Admin", color: "#ff0000", permissions: [PermissionsBitField.Flags.Administrator] },
            { name: "Moderátor", color: "#ff8800", permissions: [PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.KickMembers] },
            { name: "Helper", color: "#00aaff", permissions: [] },
            { name: "Member", color: "#ffffff", permissions: [] }
        ];

        for (const role of rolesToCreate) {
            const created = await guild.roles.create({
                name: role.name,
                color: role.color,
                permissions: role.permissions
            });
            console.log(`Vytvořena role: ${created.name}`);
        }

        // KATEGORIE + KANÁLY
        const categories = [
            {
                name: "📢 Informace",
                channels: [
                    { name: "📜 pravidla", type: 0 },
                    { name: "📣 oznámení", type: 0 }
                ]
            },
            {
                name: "💬 Komunita",
                channels: [
                    { name: "💭 chat", type: 0 },
                    { name: "📷 média", type: 0 }
                ]
            },
            {
                name: "🎤 Hlasové kanály",
                channels: [
                    { name: "🎧 Hlavní místnost", type: 2 },
                    { name: "🎮 Gaming", type: 2 }
                ]
            }
        ];

        for (const category of categories) {
            const cat = await guild.channels.create({
                name: category.name,
                type: 4
            });

            console.log(`Vytvořena kategorie: ${cat.name}`);

            for (const ch of category.channels) {
                const channel = await guild.channels.create({
                    name: ch.name,
                    type: ch.type,
                    parent: cat.id
                });
                console.log(`Vytvořen kanál: ${channel.name}`);
            }
        }

        console.log("Setup dokončen.");
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
});

client.login(process.env.TOKEN);
