module.exports = {
  name: 'help',
  adminOnly: false,
  ownerOnly: false,
  category: 'Utility',
  description: 'Interactive help menu with categories and command details',
  guide: 'Use /help for the main menu, then use buttons to navigate categories and commands',
  execute: async (bot, msg, args) => {
    const chatId = msg.chat.id;

    // Ensure commands are loaded
    if (!global.commands) {
      return bot.sendMessage(chatId, '⚠️ Commands are not loaded properly. Please contact the administrator.');
    }
    const commands = global.commands;

    // Fetch categories
    const categories = [...new Set(Object.values(commands).map(cmd => cmd.category || 'Uncategorized'))];

    // Helper function to get emoji for categories
    const getCategoryEmoji = (category) => {
      const emojiMap = {
        Utility: '🛠️',
        Fun: '🎉',
        Moderation: '🛡️',
        Information: 'ℹ️',
        Uncategorized: '❓'
      };
      return emojiMap[category] || '❓';
    };

    // Chunk Array Function: Split array into smaller chunks
    const chunkArray = (array, size) => {
      const chunks = [];
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
      }
      return chunks;
    };

    // Generate the main menu
    const createMainMenu = () => ({
      reply_markup: JSON.stringify({
        inline_keyboard: [
          ...chunkArray(
            categories.map(category => ({
              text: `${getCategoryEmoji(category)} ${category}`,
              callback_data: `help_category_${category}`
            })),
            3 // Each row will have 3 buttons
          ),
          [{ text: '🔍 Search Commands', callback_data: 'help_search' }],
          [{ text: 'ℹ️ About', callback_data: 'help_about' }]
        ]
      })
    });

    // Generate category menu
    const createCategoryMenu = (category) => ({
      reply_markup: JSON.stringify({
        inline_keyboard: [
          ...chunkArray(
            Object.entries(commands)
              .filter(([_, cmd]) => cmd.category === category)
              .map(([name]) => ({
                text: `/${name}`,
                callback_data: `help_command_${name}`
              })),
            3 // Each row will have 3 buttons
          ),
          [{ text: '🔙 Back to Categories', callback_data: 'help_main' }]
        ]
      })
    });

    // Generate command info
    const createCommandInfo = (commandName) => {
      const command = commands[commandName];
      if (!command) return null;

      const infoMessage = `*/${commandName}*\n\n` +
        `📋 Description: ${command.description || 'No description available'}\n` +
        `🗂️ Category: ${command.category || 'Uncategorized'}\n` +
        `📖 Usage: ${command.guide || 'No usage guide available'}\n` +
        `👮 Admin Only: ${command.adminOnly ? 'Yes' : 'No'}\n` +
        `👑 Owner Only: ${command.ownerOnly ? 'Yes' : 'No'}`;

      return {
        message: infoMessage,
        options: {
          parse_mode: 'Markdown',
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: '🔙 Back to Category', callback_data: `help_category_${command.category}` }],
              [{ text: '🏠 Main Menu', callback_data: 'help_main' }]
            ]
          })
        }
      };
    };

    // Handle callback queries
    const handleCallback = async (callbackQuery) => {
      const action = callbackQuery.data;
      const messageId = callbackQuery.message.message_id;

      if (action === 'help_main') {
        await bot.editMessageText('Welcome to the Help Menu! Choose a category:', {
          chat_id: chatId,
          message_id: messageId,
          ...createMainMenu()
        });
      } else if (action.startsWith('help_category_')) {
        const category = action.split('_')[2];
        await bot.editMessageText(`Commands in ${category}:`, {
          chat_id: chatId,
          message_id: messageId,
          ...createCategoryMenu(category)
        });
      } else if (action.startsWith('help_command_')) {
        const commandName = action.split('_')[2];
        const commandInfo = createCommandInfo(commandName);

        if (commandInfo) {
          await bot.editMessageText(commandInfo.message, {
            chat_id: chatId,
            message_id: messageId,
            ...commandInfo.options
          });
        }
      } else if (action === 'help_search') {
        await bot.editMessageText('To search for a command, type /help <command_name>.', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: '🏠 Back to Main Menu', callback_data: 'help_main' }]]
          })
        });
      } else if (action === 'help_about') {
        const aboutMessage = `*About This Bot*\n\n` +
          `This bot is powered by an advanced help system.\n` +
          `Total commands: ${Object.keys(commands).length}\n` +
          `Categories: ${categories.length}\n\n` +
          `Created with ❤️ by Your Name.`;
        await bot.editMessageText(aboutMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: '🏠 Back to Main Menu', callback_data: 'help_main' }]]
          })
        });
      }

      await bot.answerCallbackQuery(callbackQuery.id);
    };

    // Avoid duplicate listeners
    bot.removeListener('callback_query', handleCallback);
    bot.on('callback_query', handleCallback);

    // Handle the help command execution
    if (args.length === 0) {
      await bot.sendMessage(chatId, 'Welcome to the Help Menu! Choose a category:', createMainMenu());
    } else {
      const searchTerm = args[0].toLowerCase();
      const command = commands[searchTerm];

      if (command) {
        const commandInfo = createCommandInfo(searchTerm);
        await bot.sendMessage(chatId, commandInfo.message, commandInfo.options);
      } else {
        const similarCommands = Object.keys(commands).filter(cmd => cmd.includes(searchTerm));
        let errorMessage = `⚠️ Command /${searchTerm} not found. Use /help to see the interactive menu.`;

        if (similarCommands.length > 0) {
          errorMessage += `\n\nDid you mean:\n${similarCommands.map(cmd => `/${cmd}`).join('\n')}`;
        }

        await bot.sendMessage(chatId, errorMessage, {
          reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: '🏠 Open Help Menu', callback_data: 'help_main' }]]
          })
        });
      }
    }
  }
};