require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { connectToDatabase } = require('./db');
const schedule = require('node-schedule');
const { updateUserXP } = require('./scripts/commands/rank');
const fetch = require('node-fetch');
const { newChatMemberEvent } = require('./scripts/events/welcome.js');
const express = require('express');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
global.config = config;

// Initialize Telegram Bot
const bot = new TelegramBot(global.config.BOT_TOKEN, { polling: true });
global.bot = bot;

// Load commands
const commandsPath = path.join(__dirname, 'scripts/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = {};
let loadedCommands = 0;
let failedCommands = 0;

for (const file of commandFiles) {
  try {
    const command = require(path.join(commandsPath, file));
    commands[command.name] = command;
    loadedCommands++;
    console.log(chalk.green(`✔ Loaded command: ${command.name}`));
  } catch (error) {
    failedCommands++;
    console.error(chalk.red(`❌ Failed to load command from file: ${file}`), error.message);
  }
}
global.commands = commands;

console.log(chalk.blue(`Total commands: ${commandFiles.length}`));
console.log(chalk.green(`Successfully loaded: ${loadedCommands}`));
console.log(chalk.red(`Failed to load: ${failedCommands}`));

// Display admin names
async function displayAdminNames() {
  const adminIds = Array.isArray(global.config.ADMIN_IDS)
    ? global.config.ADMIN_IDS
    : [global.config.ADMIN_IDS];

  const adminNames = [];
  for (const adminId of adminIds) {
    try {
      const user = await bot.getChat(adminId);
      adminNames.push(user.username || user.first_name || 'Unknown');
    } catch (error) {
      console.error(`Failed to fetch admin details for ID: ${adminId}`, error.message);
    }
  }

  if (adminNames.length > 0) {
    console.log(chalk.blue(`💼 Admins: ${adminNames.join(', ')}`));
  } else {
    console.log(chalk.yellow('⚠ No admins found in the configuration.'));
  }
}

// Check for updates
async function checkVersion() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/xnil6x404/Telebotv1-version/refs/heads/main/update.json');
    const jsonData = await response.json();
    const localVersion = fs.readFileSync(path.join(__dirname, 'vs.txt'), 'utf8').trim();

    if (jsonData.version !== localVersion) {
      console.log(chalk.yellow.bold(`⚠ New update available! Current: ${localVersion}, New: ${jsonData.version}`));
      console.log(chalk.blue.bold('Bot will continue to run with the current version.'));
    } else {
      console.log(chalk.green.bold('You are up to date.'));
    }
  } catch (error) {
    console.error(chalk.red.bold('Error checking for updates.'), error);
    console.log(chalk.blue.bold('Bot will continue to run despite update check failure.'));
  }
}

// Start the bot
async function startBot() {
  try {
    await checkVersion();

    const db = await connectToDatabase();
    global.db = db;

    // Schedule weekly reports
    schedule.scheduleJob('0 0 * * 0', () => sendWeeklyReport(bot, db));
    await displayAdminNames();

    bot.on('message', async (msg) => {
      try {
        const text = msg.text || '';
        const chatType = msg.chat.type;
        const username = msg.from.username || msg.from.first_name || 'Unknown';
        const time = new Date().toLocaleTimeString();

        console.log(chalk.yellow(`[${time}] ${chatType.toUpperCase()} - ${username}: ${text}`));

        const prefix = global.config.prefix;
        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = global.commands[commandName];
        if (!command) return;

        await command.execute(bot, msg, args, db);

        // XP and leveling system
        const { leveledUp, newLevel } = await updateUserXP(db, msg.from.id, username);
        if (leveledUp) {
          bot.sendMessage(
            msg.chat.id,
            `🎊 Congratulations, ${username}! You've leveled up to ${newLevel}. Keep up the great work! 🎊`
          ).catch(error => console.error('Error sending level-up message:', error));
        }
      } catch (error) {
        console.error('Error processing message:', error);
        await bot.sendMessage(msg.chat.id, '💔 Something went wrong!');
      }
    });

    console.log(chalk.green('Bot is up and running!'));

    // Start the website
    const app = express();
    const httpPort = process.env.PORT || 3000;

    app.use(express.static(path.join(__dirname, 'website')));

    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'website', 'index.html'));
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).send('OK');
    });

    app.listen(httpPort, () => {
      console.log(chalk.green(`🌐 Website is running at http://localhost:${httpPort}`));
    });
  } catch (error) {
    console.error(chalk.red('Fatal error during bot startup:'), error);
    process.exit(1);
  }
}

startBot();
newChatMemberEvent(bot);
