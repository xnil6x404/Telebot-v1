const { MongoClient } = require('mongodb');

// সঠিকভাবে MONGO_URI ব্যবহার করুন
const mongoClient = new MongoClient(global.config.MONGO_URI);

module.exports = {
  name: 'warn',
  adminOnly: true,
  ownerOnly: false,
  category: 'Moderation',
  description: 'Warn a user in the group',
  guide: 'Reply to a message with /warn or use /warn @username [reason]',
  execute: async (bot, msg, args) => {
    try {
      await mongoClient.connect();
      const db = mongoClient.db('telegramBot');
      const warningsCollection = db.collection('warnings');

      let userId, username, reason;

      // যখন একটি মেসেজে রিপ্লাই করা হয়
      if (msg.reply_to_message) {
        userId = msg.reply_to_message.from.id;
        username = msg.reply_to_message.from.username || msg.reply_to_message.from.first_name;
        reason = args.join(' ') || 'No reason provided';
      } 
      // যখন @username দিয়ে ওয়ার্ন করার চেষ্টা করা হয়
      else if (args.length > 0) {
        username = args[0].replace('@', '');
        try {
          const chatMembers = await bot.getChatAdministrators(msg.chat.id);
          const user = chatMembers.find((member) => member.user.username === username);

          if (!user) {
            return bot.sendMessage(msg.chat.id, 'Unable to find the specified user.');
          }
          userId = user.user.id;
        } catch (error) {
          console.error('Error finding user:', error);
          return bot.sendMessage(msg.chat.id, 'Unable to find the specified user.');
        }
        reason = args.slice(1).join(' ') || 'No reason provided';
      } 
      // যদি ইউজার বা রিপ্লাই না করা হয়
      else {
        return bot.sendMessage(msg.chat.id, 'Please reply to a message or provide a username to warn.');
      }

      const warning = {
        userId,
        username,
        chatId: msg.chat.id,
        reason,
        timestamp: new Date()
      };

      await warningsCollection.insertOne(warning);

      const warningCount = await warningsCollection.countDocuments({ userId, chatId: msg.chat.id });

      let response = `⚠ User ${username} has been warned.\nReason: ${reason}\nTotal warnings: ${warningCount}`;

      // যদি ওয়ার্নিং ৩ বা তার বেশি হয়
      if (warningCount >= 3) {
        try {
          await bot.banChatMember(msg.chat.id, userId);
          response += '\n🚫 User has been banned due to exceeding warning limit.';
        } catch (error) {
          console.error('Error banning user:', error);
          response += '\n❌ Failed to ban user. Please check bot permissions.';
        }
      }

      await bot.sendMessage(msg.chat.id, response);
    } catch (error) {
      console.error('Error in warn command:', error);
      await bot.sendMessage(msg.chat.id, 'An error occurred while trying to warn the user.');
    } finally {
      await mongoClient.close();
    }
  }
};