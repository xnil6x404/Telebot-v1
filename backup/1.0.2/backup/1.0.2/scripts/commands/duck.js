const axios = require('axios');

module.exports = {
  name: 'duck',
  adminOnly: false,
  ownerOnly: false,
  category: 'Search',
  description: 'Search using DuckDuckGo',
  guide: 'Use /duck followed by your search query',
  execute: async (bot, msg, args) => {
    const chatId = msg.chat.id;

    if (args.length === 0) {
      return bot.sendMessage(chatId, 'Please provide a search query after /duck');
    }

    const query = args.join(' ');
    const apiUrl = `https://api.nexalo.xyz/duckduckgo?query=${encodeURIComponent(query)}`;

    try {
      const response = await axios.get(apiUrl);
      const { title, description, source, url } = response.data;

      const message = `*${title}*\n\n${description}\n\nSource: ${source}\nURL: ${url}`;

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in duck command:', error);
      await bot.sendMessage(chatId, 'An error occurred while processing your request. Please try again later.');
    }
  }
};