import { ChatGPTAPIBrowser } from 'chatgpt';
import { Client, Collection, Events, SlashCommandBuilder, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from "dotenv";

dotenv.config();



const chatGPTAPI = new ChatGPTAPIBrowser({
    email: process.env.OPENAI_EMAIL,
    password: process.env.OPENAI_PASSWORD
});

await chatGPTAPI.initSession();



const query = {
    data: new SlashCommandBuilder()
        .setName('query')
        .setDescription('Queries ChatGPT with specified message')
        .addStringOption(option =>
            option
                .setName('input')
                .setDescription('The message ask ChatGOT with.')
                .setMaxLength(2000)
                .setRequired(true)),
    async execute(interaction) {
        const input = interaction.options.getString('input');
        await interaction.deferReply();
        const result = await chatGPTAPI.sendMessage(input)
		await interaction.editReply(result.response);
}};

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: [query.data.toJSON()] },
);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
client.commands.set("query", query);

client.login(process.env.DISCORD_TOKEN);



client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
    }
});