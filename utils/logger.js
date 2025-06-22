const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.resolve('./logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Creates and configures a Winston logger instance
 * @param {string} level - Log level (debug, info, warn, error)
 * @returns {winston.Logger} Configured logger instance
 */
function createLogger(level = 'info') {
  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level.toUpperCase()}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ 
        filename: path.join(logsDir, 'error.log'), 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: path.join(logsDir, 'telegram-bot.log')
      })
    ]
  });
}

module.exports = { createLogger };