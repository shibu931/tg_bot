const { createInterface } = require('readline');

/**
 * Handles Telegram authentication
 * Provides methods for user authentication and session management
 */
class TelegramAuth {
  /**
   * Creates a new TelegramAuth instance
   * @param {Object} client - Telegram client instance
   * @param {Object} logger - Winston logger instance
   * @param {Object} sessionManager - Session manager instance
   */
  constructor(client, logger, sessionManager) {
    this.client = client;
    this.logger = logger;
    this.sessionManager = sessionManager;
  }

  /**
   * Gets user input from console
   * @param {string} question - Question to display to user
   * @returns {Promise<string>} User input
   */
  async getUserInput(question) {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question(question, answer => {
        rl.close();
        resolve(answer);
      });
    });
  }

  /**
   * Authenticates the user with Telegram
   * @param {string} phoneNumber - User's phone number
   * @param {number} apiId - Telegram API ID
   * @param {string} apiHash - Telegram API Hash
   * @returns {Promise<boolean>} Authentication success status
   */
  async authenticate(phoneNumber, apiId, apiHash) {
    try {
      // Debug log parameters
      this.logger.info(`Authentication attempt with phone: ${phoneNumber}`);
      this.logger.info(`API ID type: ${typeof apiId}, value: ${apiId}`);
      
      // Validate parameters
      if (!phoneNumber) {
        this.logger.error('Phone number is undefined or empty');
        return false;
      }
      
      // Ensure phone number has the + prefix for international format
      if (!phoneNumber.startsWith('+')) {
        this.logger.warn('Phone number does not start with +, adding it automatically');
        phoneNumber = '+' + phoneNumber;
      }
      
      if (!apiId || !apiHash) {
        this.logger.error('API credentials are missing');
        return false;
      }
      
      // Check if already authenticated
      if (await this.client.isUserAuthorized()) {
        this.logger.info('User already authorized. Using saved session.');
        return true;
      }
      
      this.logger.info('User not authorized. Starting authentication process...');
      
      // Use client.start() which handles the entire authentication flow
      await this.client.start({
        phoneNumber: async () => {
          this.logger.info(`Using phone number: ${phoneNumber}`);
          return phoneNumber;
        },
        password: async () => {
          const password = await this.getUserInput('Please enter your 2FA password: ');
          this.logger.info('Password entered for 2FA');
          return password;
        },
        phoneCode: async () => {
          const code = await this.getUserInput('Please enter the code you received: ');
          this.logger.info('Authentication code entered');
          return code;
        },
        onError: (err) => {
          this.logger.error(`Authentication error: ${err.message}`);
        }
      });
      
      // Save the session for future use
      if (await this.client.isUserAuthorized()) {
        this.logger.info('Successfully logged in!');
        this.sessionManager.saveSession(this.client.session.save());
        return true;
      } else {
        throw new Error('Authentication failed for unknown reason');
      }
    } catch (err) {
      this.logger.error(`Authentication failed: ${err.message}`);
      return false;
    }
  }

  /**
   * Gets the current user's information
   * @returns {Promise<Object>} User information
   */
  async getCurrentUser() {
    try {
      if (await this.client.isUserAuthorized()) {
        const me = await this.client.getMe();
        return me;
      }
      return null;
    } catch (err) {
      this.logger.error(`Failed to get current user: ${err.message}`);
      return null;
    }
  }
}

module.exports = TelegramAuth;