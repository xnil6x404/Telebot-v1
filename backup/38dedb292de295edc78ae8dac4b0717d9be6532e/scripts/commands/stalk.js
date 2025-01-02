const { escapeMarkdown } = require('../../utils/markdown');

module.exports = {
  name: 'stalk',
  adminOnly: false,
  ownerOnly: false,
  category: 'Utility',
  description: 'Show user information',
  guide: 'Use /stalk to see your own info, or reply to a message with /stalk to see that user\'s info',
  execute: async (bot, msg) => {
    const chatId = msg.chat.id;
    let targetUser;

    if (msg.reply_to_message) {
      targetUser = msg.reply_to_message.from;
    } else {
      targetUser = msg.from;
    }

    try {
      const userInfo = await bot.getUserProfilePhotos(targetUser.id, 0, 1);
      const chatMember = await bot.getChatMember(chatId, targetUser.id);

      const createUserInfo = (user) => {
        const fullName = escapeMarkdown(`${user.first_name || ''} ${user.last_name || ''}`.trim());
        const username = user.username ? escapeMarkdown(`@${user.username}`) : 'Not set';
        const userLink = `tg://user?id=${user.id}`;
        const bio = escapeMarkdown(chatMember.user.bio || 'Not available');

        return `*User Information*
🆔 *User ID:* \`${user.id}\`
👤 *Full Name:* ${fullName}
🌟 *Username:* ${username}
📝 *Bio:* ${bio}
🔗 *Contact:* [${fullName}](${userLink})`;
      };

      const userInfoText = createUserInfo(targetUser);

      if (userInfo && userInfo.photos && userInfo.photos.length > 0) {
        const photo = userInfo.photos[0][0];
        await bot.sendPhoto(chatId, photo.file_id, {
          caption: userInfoText,
          parse_mode: 'Markdown'
        });
      } else {
        await bot.sendMessage(chatId, userInfoText, { parse_mode: 'Markdown' });
      }
    } catch (error) {
      console.error('Error in stalk command:', error);
      await bot.sendMessage(chatId, 'An error occurred while fetching user information. Please try again later.');
    }
  }
};

