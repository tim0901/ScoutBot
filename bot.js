
// Load .env file
const dotenv = require('dotenv')
dotenv.config()
const token = process.env.DISCORD_TOKEN;
const clientID = process.env.CLIENTID;


// Load discord.js requirements
const fs = require('node:fs');
const path = require('node:path');
const { ActionRowBuilder, Client, Collection, EmbedBuilder, Events, GatewayIntentBits, ModalBuilder, REST, roleMention, Routes, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] })
client.commands = new Collection();

// Where are the commands stored?
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// We are going to assume that all .js files in the commands folder are command files, and so will load each one
const commands = [];

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);

	// Load valid commands
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	}
	else {
		console.log(`[WARNING] The command at ${filePath} is invalid`)
	}

	// Grab the SlashCommandBuilderToJSON() output of each command's data for deployment
	commands.push(command.data.toJSON());
}

// Now that we've loaded all of the commands, we can register them with Discord
const rest = new REST().setToken(token);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`)

		const data = await rest.put(
			Routes.applicationCommands(clientID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`)
	} catch (error) {
		console.error(error);
	}
})(token);

// Once the client is ready, run this!
client.once(Events.ClientReady, c => {
	console.log('Ready!');
});

// If a valid command has been called, dispatch it. If not, report the error.
client.on(Events.InteractionCreate, async interaction => {

	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error)
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command. Please contact Alex.', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command. Please contact Alex.', ephemeral: true });
		}
	}
});

// Look for button pressess
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isButton()) return;

	// The channel that the submission should be sent to is stored in the button's customId attribute
	const regex = /submitAMessage\?channel=<#(\d+)>\?role=<@&(\d+)>/;
	const match = interaction.customId.match(regex);

	if (match) {

		const destinationChannelId = match[1];

		// Create modal
		const modal = new ModalBuilder()
			.setCustomId(`submitAMessageModal?channel=<#${destinationChannelId}>?role=<@&${match[2]}>`)
			.setTitle('Submit a Message');

		// Add components to modal 
		const inputTextBox = new TextInputBuilder()
			.setCustomId('messageText')
			.setLabel("What would you like to say?")
			.setPlaceholder('Max 4000 characters - feel free to send multiple messages')
			.setRequired(true)
			.setStyle(TextInputStyle.Paragraph); // Multi-line text box

		const row = new ActionRowBuilder().addComponents(inputTextBox);

		modal.addComponents(row);

		await interaction.showModal(modal);
	}

});

// Look for Modal Responses

client.on(Events.InteractionCreate, async (interaction) => {

	if (!interaction.isModalSubmit()) return;

	// Look for valid submissions
	const regex = /submitAMessageModal\?channel=<#(\d+)>\?role=<@&(\d+)>/;
	const match = interaction.customId.match(regex);

	if (match) {
		// Someone has submitted a message

		// Create mention to alert the correct role
		const mention = roleMention(`${match[2]}`);

		// Create embed
		const responseEmbed = new EmbedBuilder()
			.setColor(0xFF0000)
			.setAuthor({ name: interaction.member.displayName, iconURL: interaction.user.displayAvatarURL({ extension: 'jpg' }) })
			.addFields(
				{ name: 'What would you like to say?', value: interaction.fields.getTextInputValue('messageText') }
			);

		// Send message to designated channel
		const channel = await client.channels.fetch(`${match[1]}`);
		await channel.send({ content: `An Explorer has sent an important message to ${mention} through the submission form:`, embeds: [responseEmbed] });

		// Send response to sender
		await interaction.reply({ content: 'Message submitted', ephemeral: true });

	}

});

// Log into discord with the client's token!
client.login(token);
