async function welcomeCommand(bot, msg, groupName, memberCount, newMember) {
  // Ensure memberCount is not undefined and fallback to 0 if necessary
  memberCount = memberCount || msg.chat.members_count || 0;

  // Log the new member to check the structure
  console.log('New Member:', newMember);

  // Check if newMember is valid and has username or first_name
  const memberName = newMember.username || newMember.first_name || 'Unknown Member';

  const welcomeMessage = `
    Welcome to the ${groupName}! 🤖
    New Member: ${memberName} 👤
  `;

  // Add an image URL (you can replace this URL with your own)
  const imageUrl = 'https://i.imgur.com/r7VXil2.jpeg'; // Replace with your image URL

  // Send the welcome message with the image
  bot.sendMessage(msg.chat.id, welcomeMessage, {
    parse_mode: 'HTML', // Enables HTML formatting for the message
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Join the fun!', url: 'https://yourgroup.link' } // Replace with your group link if needed
        ]
      ]
    }
  });

  // Send the image separately
  bot.sendPhoto(msg.chat.id, imageUrl);
}

// Event listener for new members joining the group
function newChatMemberEvent(bot) {
  bot.on('new_chat_members', async (msg) => {
    const groupName = msg.chat.title;
    const memberCount = msg.chat.members_count || msg.chat.participants_count || 0;  // Fallback if members_count is unavailable

    // Log the new members to check their structure
    console.log('New members joined:', msg.new_chat_members);

    // Process each new member
    for (const newMember of msg.new_chat_members) {
      console.log(`New member:`, newMember);
      await welcomeCommand(bot, msg, groupName, memberCount, newMember); // Call the welcome command
    }
  });
}

module.exports = { newChatMemberEvent };