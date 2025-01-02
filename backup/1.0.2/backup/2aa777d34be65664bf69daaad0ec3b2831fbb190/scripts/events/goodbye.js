const fetch = require('node-fetch');

async function execute(bot, msg, groupName, memberCount) {
  const chatId = msg.chat.id;
  const leftMember = msg.left_chat_member;
  const username = leftMember.username || leftMember.first_name || 'User';
  const userId = leftMember.id;

  // Get user's profile photos
  let userProfilePhoto = 'https://nexalo.xyz/assets/nexa.png'; // Default image
  try {
    const userPhotos = await bot.getUserProfilePhotos(userId, 0, 1);
    if (userPhotos.total_count > 0) {
      const fileId = userPhotos.photos[0][0].file_id;
      const file = await bot.getFile(fileId);
      userProfilePhoto = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    }
  } catch (error) {
    console.error('Error getting user profile photo:', error);
  }

  try {
    // Fetch the goodbye image from the API
    const apiUrl = `https://api.nexalo.xyz/goodbye?api=na_T51VHMGBMZJO7S2B&name=${encodeURIComponent(username)}&text=${encodeURIComponent(`Goodbye ${username}`)}&image=${encodeURIComponent(userProfilePhoto)}`;
    const response = await fetch(apiUrl);
    const imageBuffer = await response.buffer();

    // Create a mention of the user
    const userMention = `<a href="tg://user?id=${userId}">${username}</a>`;

    // Send the goodbye message with the image and user mention
    await bot.sendPhoto(chatId, imageBuffer, {
      caption: `Goodbye, ${userMention}! 👋\nWe're sad to see you go. You were our ${memberCount + 1}th member.\n\nWe hope you enjoyed your time in ${groupName} and wish you all the best!`,
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Error in goodbye event:', error);
    // Send a text-only goodbye message as fallback, still with user mention
    const userMention = `<a href="tg://user?id=${userId}">${username}</a>`;
    await bot.sendMessage(chatId, `Goodbye, ${userMention}! 👋\nWe're sad to see you go. You were our ${memberCount + 1}th member.\n\nWe hope you enjoyed your time in ${groupName} and wish you all the best!`, {
      parse_mode: 'HTML'
    });
  }
}

module.exports = {
  name: 'goodbye',
  execute
};