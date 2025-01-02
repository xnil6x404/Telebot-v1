const { MessageEntity } = require('node-telegram-bot-api');

module.exports = {
  name: 'help',
  adminOnly: false,
  ownerOnly: false,
  category: 'Utility',
  description: 'Show all available commands',
  guide: 'Use /help to see all commands',
  execute: async (bot, msg) => {
    const chatId = msg.chat.id;
    const commands = global.commands; // Access global commands

    if (!commands || Object.keys(commands).length === 0) {
      return bot.sendMessage(chatId, 'Error: Commands not available. Please try again later.');
    }

    const createCommandList = (cmds) => {
      const categories = {};
      Object.entries(cmds).forEach(([name, cmd]) => {
        if (!cmd.category) return; // Skip commands without a category
        if (!categories[cmd.category]) {
          categories[cmd.category] = [];
        }
        categories[cmd.category].push(name);
      });

      let commandList = '';
      for (const [category, cmds] of Object.entries(categories)) {
        commandList += `╭───✿ ${category}\n`;
        for (let i = 0; i < cmds.length; i += 2) {
          commandList += `│♡ ${cmds[i]}${cmds[i + 1] ? ` ♡ ${cmds[i + 1]}` : ''}\n`;
        }
        commandList += `╰───────────✿\n`;
      }
      return commandList;
    };

    try {
      const commandList = createCommandList(commands);
      const totalCommands = Object.keys(commands).length;

      const finalMessage = `${commandList}
╭───✿ SUPPORT GC
│If you don't know how to
│use Nexalo or face any
│problem then please join
│our Support GC by clicking
│the button below.
├─────✿
│» Total Cmds: ${totalCommands}.
│» Type ${global.config.prefix}help <cmd> to learn
│how to use a command.
╰─────────────✿`;

      const keyboard = {
        inline_keyboard: [
          [{ text: 'Join Support Group', url: 'https://t.me/example_support_group' }]
        ]
      };

      await bot.sendMessage(chatId, finalMessage, {
        parse_mode: 'Markdown',
        reply_markup: JSON.stringify(keyboard),
      });
    } catch (error) {
      console.error('Error in help command:', error);
      await bot.sendMessage(chatId, 'An error occurred while fetching the help information. Please try again later.');
    }
  },
};