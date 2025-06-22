require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const path = require('path');

// Import configuration
const config = require('./config.json');

// Import utility modules
const { createLogger } = require('./utils/logger');
const SessionManager = require('./utils/session');
const TelegramAuth = require('./utils/auth');
const Messenger = require('./utils/messenger');
const Scheduler = require('./utils/scheduler');

// Initialize logger
const logger = createLogger(process.env.LOG_LEVEL || config.advanced.logLevel || 'info');

// Main function
async function main() {
  try {
    logger.info('Starting Telegram Automation Tool');
    
    // Initialize session manager
    const sessionManager = new SessionManager(
      logger, 
      config.advanced.sessionSavePath || './session'
    );
    
    // Initialize Telegram client
    const apiId = parseInt(process.env.API_ID || config.auth.apiId);
    const apiHash = process.env.API_HASH || config.auth.apiHash;
    const phoneNumber = process.env.PHONE_NUMBER || config.auth.phoneNumber;
    
    // Debug log credentials (without sensitive data)
    logger.info(`Using API ID: ${apiId}`);
    logger.info(`Phone number being used: ${phoneNumber}`);
    
    // Ensure phone number is defined
    if (!phoneNumber) {
      logger.error('Phone number is undefined. Check your .env and config.json files.');
      process.exit(1);
    }
    
    // Load or create session
    const stringSession = new StringSession(sessionManager.getSession());
    
    // Create client
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: config.advanced.retryAttempts || 3,
      retryDelay: config.advanced.retryDelay || 5000,
      useWSS: true,
    });
    
    // Initialize auth handler
    const auth = new TelegramAuth(client, logger, sessionManager);
    
    // Authenticate
    const authSuccess = await auth.authenticate(phoneNumber, apiId, apiHash);
    
    if (!authSuccess) {
      logger.error('Authentication failed. Exiting...');
      process.exit(1);
    }
    
    // Get current user info
    const currentUser = await auth.getCurrentUser();
    if (currentUser) {
      logger.info(`Logged in as: ${currentUser.firstName} ${currentUser.lastName || ''} (@${currentUser.username || 'no_username'})`);
    }
    
    // Initialize messenger
    const messenger = new Messenger(client, logger);
    
    // Initialize scheduler
    const scheduler = new Scheduler(logger);
    
    // Setup message sending task
    const sendTask = async () => {
      const { message } = config.messaging;
      const { targets } = config.messaging;
      
      await messenger.sendMessagesToAllTargets(
        targets, 
        message, 
        config.advanced.messageDelay || 2000
      );
    };
    
    // Setup scheduling based on config
    const { type } = config.scheduling;
    
    if (type === 'interval') {
      const { value, unit } = config.scheduling;
      const cronExpression = scheduler.intervalToCron(value, unit);
      scheduler.scheduleTask(cronExpression, sendTask);
      logger.info(`Messages will be sent according to interval schedule: ${cronExpression}`);
    } else if (type === 'daily') {
      const { times } = config.scheduling;
      scheduler.scheduleMultipleDailyTimes(times, sendTask);
      logger.info(`Messages will be sent daily at these times: ${times.join(', ')}`);
    } else if (type === 'cron') {
      const cronExpression = config.scheduling.value;
      scheduler.scheduleTask(cronExpression, sendTask);
      logger.info(`Messages will be sent according to custom cron schedule: ${cronExpression}`);
    } else {
      logger.error(`Unsupported scheduling type: ${type}`);
      process.exit(1);
    }
    logger.info('Telegram Automation Tool is running. Press Ctrl+C to exit.');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down...');
      scheduler.stopAllTasks();
      await client.disconnect();
      process.exit(0);
    });
    
  } catch (err) {
    logger.error(`Main process error: ${err.message}`);
    process.exit(1);
  }
}

// Start the application
main();