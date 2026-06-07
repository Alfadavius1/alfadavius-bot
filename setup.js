const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', async () => {
  console.log(`Setup spuštěn jako ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);

  // ROLE
  const roles = [
    { name: 'Admin', color: 0xff0000, permissions: PermissionsBitField.Flags.Administrator },
    { name: 'Moderátor', color: 0xff4444, permissions: PermissionsBitField.Flags.ManageMessages | PermissionsBitField.Flags.KickMembers },
    { name: 'Helper', color: 0xff7777, permissions: PermissionsBitField.Flags.ManageMessages },
    { name: 'VIP', color: 0x8b0000, permissions: 0 },
    { name: 'Bot', color: 0x00ffff, permissions: PermissionsBitField.Flags.ManageMessages },
    { name: 'Member', color: 0xffffff, permissions: 0 }
  ];

  for (const role of roles) {
    await guild.roles.create({
      name: role.name,
      color: role.color,
      permissions: role.permissions
    });
    console.log(`Vytvořena role: ${role.name}`);
  }

  // KATEGORIE + KANÁLY
  const structure = [
    {
      name: '📢 Oznámení',
      channels: ['pravidla', 'novinky', 'uvitani']
    },
    {
      name: '💬 Komunita',
      channels: ['obecny-chat', 'memes', 'fotky', 'dotazy']
    },
    {
      name: '🎮 Gaming',
      channels: ['hry-chat', 'hledam-spoluhrace', 'Hraní 1', 'Hraní 2']
    },
    {
      name: '🎥 Stream & Media',
      channels: ['live-stream', 'klipy', 'oznameni-streamu']
    },
    {
      name: '🤖 Boty & Ekonomika',
      channels: ['bot-commands', 'rpg', 'logy']
    },
    {
      name: '🛡 Moderace',
      channels: ['mod-log', 'admin-chat']
    }
  ];

  for (const category of structure) {
    const cat = await guild.channels.create({
      name: category.name,
      type: ChannelType.GuildCategory
    });

    for (const ch of category.channels) {
      await guild.channels.create({
        name: ch,
        type: ch.includes('Hraní') ? ChannelType.GuildVoice : ChannelType.GuildText,
        parent: cat.id
      });
    }

    console.log(`Kategorie vytvořena: ${category.name}`);
  }

  console.log('Setup dokončen.');
  process.exit(0);
});

client.login(process.env.TOKEN);
