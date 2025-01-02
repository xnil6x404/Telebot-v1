<img src="https://i.ibb.co.com/gDF63b8/nexalo.jpg" alt="XNIL6X Bot Banner">

<center><h1>XNIL6X-BOT - Advanced Telegram Bot</h1></center>
<p align="center">
<img src="https://img.shields.io/badge/Node.js%20Support-20.x-blue" alt="Node.js Support">
<img src="https://img.shields.io/badge/project_version-1.0.5-red" alt="Project Version">
<img src="https://img.shields.io/badge/license-MIT-gray" alt="MIT LICENSE">
</p>

A feature-rich Telegram bot built with Node.js that provides various utility, moderation, and entertainment commands.

<p align="center">
  <a href="https://www.youtube.com/@bdnoobra" target="_blank">
    <img src="https://i.ibb.co.com/LntSL4y/20241109-124517.png" alt="XNIL6X-BOT Setup Tutorial" style="width:300px; height:80px; border-radius:10px;">
  </a>
    <a href="https://cmd.nexalo.xyz/" target="_blank">
    <img src="https://i.ibb.co.com/DbzLFsN/20241109-124743.png" alt="XNIL6X-BOT Setup Tutorial" style="width:300px; height:80px; border-radius:10px;">
  </a>
    <a href="https://t.me/xnil6xbot" target="_blank">
    <img src="https://i.ibb.co.com/YL5C4YX/20241109-124634.png" alt="XNIL6X-BOTSetup Tutorial" style="width:300px; height:80px; border-radius:10px;">
  </a>
</p>

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Command Structure](#command-structure)
- [Creating Commands](#creating-commands)
- [Available Commands](#available-commands)
- [Database Setup](#database-setup)
- [Contributing](#contributing)
- [License](#license)

## Features

- 🛡️ Advanced group moderation (kick, ban, mute, warn)
- 🎵 Music and video downloads
- 🎮 Fun commands and games
- 🔧 Utility functions
- 📊 MongoDB integration for data persistence
- ⚡ Fast and efficient command handling

## Prerequisites

- Node.js v16.x or higher
- MongoDB v4.x or higher
- A Telegram Bot Token (get it from [@BotFather](https://t.me/BotFather))
- Basic knowledge of JavaScript/Node.js

## Installation

1. Clone the repository:
```bash
git clone https://github.com/xnil6x404/Telebot-v1.git
cd Telebot-v1
```

2. Install dependencies:
```bash
npm install
```

3. SETUP `config.json`file:
```

{
  "BOT_TOKEN": "YOUR_BOT_TOKEN",
  "ADMIN_IDS": ["ADMIN_ID_HERE"],
  "ADMIN_NAME": "BOT_ADMIN_NAME",
  "prefix": ".",
  "MONGO_URI": "YOUR_MONGODB_URI",
  "DB_NAME": "MONGODB",
  "LEVEL_UP_MESSAGE": "🎊 Congratulations, {username}! You've leveled up to {level}. Keep up the great work! 🎊",
  "OWNER_ONLY_MESSAGE": "🚫 This command is restricted to the bot owner."
}
```

4. Start the bot:
```bash
node bot.js
```

## Configuration

The bot uses environment variables for configuration. Create a `config.json` file with the following variables:

- `BOT_TOKEN`: Your Telegram bot token
- `MONGO_URI`: MongoDB connection string
- `DB_NAME` : Your Mongodb name
- `ADMIN_IDS`: Your Telegram user ID (for owner-only commands)

## Command Structure

Commands should be created in the `commands` directory with the following structure:

```javascript
module.exports = {
  name: 'commandname',
  adminOnly: false,
  ownerOnly: false,
  category: 'Category',
  description: 'Command description',
  guide: 'How to use the command',
  execute: async (bot, msg, args) => {
    // Command logic here
  }
};
```

### Command Properties

- `name`: Command name (without the / prefix)
- `adminOnly`: Whether the command requires admin privileges
- `ownerOnly`: Whether the command is restricted to bot owner
- `category`: Command category for help menu organization
- `description`: Brief description of what the command does
- `guide`: Usage instructions
- `execute`: Async function containing command logic

## Creating Commands

Here's a step-by-step guide to creating new commands:

1. Create a new file in the `commands` directory:
```javascript
// commands/hello.js
module.exports = {
  name: 'hello',
  adminOnly: false,
  ownerOnly: false,
  category: 'Fun',
  description: 'Sends a greeting',
  guide: 'Use /hello to receive a greeting',
  execute: async (bot, msg, args) => {
    await bot.sendMessage(msg.chat.id, 'Hello! 👋');
  }
};
```

2. The command will be automatically loaded by the bot.

### Advanced Command Example

Here's an example of a more complex command with argument handling and error checking:

```javascript
// commands/remind.js
module.exports = {
  name: 'remind',
  adminOnly: false,
  ownerOnly: false,
  category: 'Utility',
  description: 'Set a reminder',
  guide: 'Use /remind <time> <message>',
  execute: async (bot, msg, args) => {
    if (args.length < 2) {
      return bot.sendMessage(msg.chat.id, 'Please provide time and message');
    }

    const time = parseInt(args[0]);
    const message = args.slice(1).join(' ');

    if (isNaN(time)) {
      return bot.sendMessage(msg.chat.id, 'Please provide a valid time in minutes');
    }

    setTimeout(() => {
      bot.sendMessage(msg.chat.id, `Reminder: ${message}`);
    }, time * 60000);

    await bot.sendMessage(msg.chat.id, `Reminder set for ${time} minutes from now`);
  }
};
```


## Database Setup

The bot uses MongoDB for data persistence. Here's how to set up your database:

1. Create a MongoDB database
2. Set up collections:
   - `warnings`: Store user warnings
   - `settings`: Store group settings
   - `userdata`: Store user-specific data

### Database Schema Examples

Warnings Collection:
```javascript
{
  userId: String,
  username: String,
  chatId: String,
  reason: String,
  timestamp: Date
}
```

Settings Collection:
```javascript
{
  chatId: String,
  welcomeMessage: String,
  antiSpam: Boolean,
  maxWarnings: Number
}
```

## Mongo DB Add Balance To User Account 

```javascript 
const { ObjectId } = require('mongodb');

module.exports = {
  name: 'addCoins',
  adminOnly: false, // Set to true if only admins should use this command
  ownerOnly: false, // Set to true if only the bot owner should use this command
  category: 'Economy',
  description: 'Add coins to a user\'s balance',
  guide: 'Use /addCoins to add coins to your account',
  execute: async (bot, msg, args, db) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const coinAmount = 10; // Amount to add

    try {
      const user = await db.collection('users').findOne({ userId });

      if (user) {
        await db.collection('users').updateOne(
          { userId },
          { $inc: { balance: coinAmount } }
        );
      } else {
        await db.collection('users').insertOne({
          userId,
          balance: coinAmount,
          lastDaily: new Date(0) // Initialize lastDaily if not needed immediately
        });
      }

      bot.sendMessage(chatId, `10 coins have been added to your balance!`);
    } catch (error) {
      console.error('Error in addCoins command:', error);
      bot.sendMessage(chatId, 'An error occurred while processing your request.');
    }
  }
};


```

## Use User Account Balance/Coin

```javascript
const { ObjectId } = require('mongodb');

module.exports = {
  name: 'usecoin',
  adminOnly: false,
  ownerOnly: false,
  category: 'Economy',
  description: 'Use 10 coins for a special action!',
  guide: 'Use /usecoin to spend 10 coins on an action',
  execute: async (bot, msg, args, db) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const coinCost = 10; // Cost of the action in coins

    try {
      // Check user balance
      const user = await db.collection('users').findOne({ userId });
      if (!user || user.balance < coinCost) {
        return bot.sendMessage(chatId, `Insufficient balance. You need at least ${coinCost} coins to perform this action.`);
      }

      // Perform the action (e.g., sending a confirmation message)
      await bot.sendMessage(chatId, 'You have successfully used 10 coins for this special action!');

      // Deduct 10 coins from user's balance
      await db.collection('users').updateOne(
        { userId },
        { $inc: { balance: -coinCost } }
      );

      bot.sendMessage(chatId, `${coinCost} coins have been deducted from your account.`);
    } catch (error) {
      console.error('Error in usecoin command:', error);
      bot.sendMessage(chatId, 'An error occurred while processing your request. Please try again later.');
    }
  }
};


```

## Contributing

1. Fork the repository
2. Submit a pull request


### Coding Standards

- Use ES6+ features
- Maintain consistent error handling
- Add comments for complex logic
- Follow the existing command structure
- Test thoroughly before submitting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you need help or have questions:
- Open an issue on GitHub
- Contact the bot owner through Telegram
- Check the [Wiki](#) for additional documentation

---

## Contact Options 
  <table border="1" cellpadding="10" cellspacing="0">
    <tr>
      <th>Discord</th>
      <th>Telegram</th>
      <th>Instagram</th>
      <th>YouTube</th>
    </tr>
    <tr>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/6b381b30-861d-4a3c-859a-367da4956347" alt="Facebook QR" width="150"><br>
        <a href="https://discord.gg/yfBx5GU9Xr">Eliana Support Server</a>
      </td>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/0bd6fcf3-332b-400b-8edf-0aa613c2d7bc" alt="Telegram QR" width="150"><br>
        <a href="https://t.me/BD_NOOBRA">BD_NOOBRA</a>
      </td>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/727d205c-3f31-494b-ba2e-a594122d2b20" alt="Twitter QR" width="150"><br>
        <a href="https://www.instagram.com/hridoycode/">HridoyCode</a>
      </td>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/f9dedbbb-606c-4ab5-b67b-73ab2f640ebb" alt="YouTube QR" width="150"><br>
        <a href="https://www.youtube.com/@hridoy-code">Hridoy Code</a>
      </td>
    </tr>
  </table>

Made with ❤️ by Hridoy
