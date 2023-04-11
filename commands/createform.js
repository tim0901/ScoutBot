
// Code for the /CreateForm command

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js')

// Commands have two components: data and execute
// 
// data is the information that Discord has about the command - what shows up when you type it
// execute is the functional part - what does the command do when you call it?
//
// When you call a command, you create an interaction, which the bot can reply to.

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createform')
    .setDescription('Create a submission form')
    .addChannelOption(option =>
      option.setName('submissionschannel')
        .setDescription('The channel that submissions should be sent to')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('A role that should be notified when a submission is made through this form')
        .setRequired(true)),
  async execute(interaction) {

    // Only allow server administrators to set up a form like this
    if (!interaction.member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({content: 'You don\'t have permission to run this command.', ephemeral: true});
    }
    else {

      // Create the button to open the modal
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`submitAMessage?channel=${interaction.options.getChannel('submissionschannel')}?role=${interaction.options.getRole('role')}`)
            .setLabel('Send a Message')
            .setStyle(ButtonStyle.Primary),
        );

      // Create embed
      const reportButtonEmbed = new EmbedBuilder()
        .setTitle('Send a message to the Leaders Team')
        .setDescription('If you have any concerns about something that has happened - inside or outside of Scouting - and would like to report it to the leaders team, feel free to fill out this form. \n\nWe cannot promise to keep anything private - if we think that you or anyone else is in danger, we have a duty to report this. However, we can promise to take everything you say seriously and to do our best to help you.');
      const currentChannel = interaction.channel;
      await currentChannel.send({ embeds: [reportButtonEmbed], components: [row] });

      await interaction.reply({ content: 'Form created', ephemeral: true });
    }
  },
};
