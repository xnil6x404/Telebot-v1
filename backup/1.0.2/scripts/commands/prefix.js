module.exports = {
  name: 'prefix', // Command name
  description: 'Displays the current prefix',
  adminOnly: false, // Not limited to admins
  execute: async (bot, msg, args) => {
    try {
      const prefix = global.config.prefix; // Fetch current prefix
      await bot.sendMessage(
        msg.chat.id,
        `🔹 The current prefix is: \`${prefix}\`\nUse this prefix before commands. Example: \`${prefix}help\``
      );
    } catch (error) {
      console.error('Error executing prefix command:', error.message);
      await bot.sendMessage(msg.chat.id, '💔 Failed to display the prefix.');
    }
  },
};