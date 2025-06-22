const fs = require('fs');
const path = require('path');

/**
 * Handles Telegram session management
 * Provides functions to save and retrieve session data
 */
class SessionManager {
  /**
   * Creates a new SessionManager instance
   * @param {Object} logger - Winston logger instance
   * @param {string} sessionDir - Directory to store session files
   */
  constructor(logger, sessionDir = './session') {
    this.logger = logger;
    this.sessionDir = path.resolve(sessionDir);
    this.sessionFilePath = path.join(this.sessionDir, 'session.json');
    
    // Create session directory if it doesn't exist
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
      this.logger.info(`Created session directory: ${this.sessionDir}`);
    }
  }

  /**
   * Retrieves the saved session string
   * @returns {string} Session string or empty string if not found
   */
  getSession() {
    try {
      if (fs.existsSync(this.sessionFilePath)) {
        const session = fs.readFileSync(this.sessionFilePath, 'utf8');
        this.logger.info('Session loaded successfully');
        return session;
      }
    } catch (err) {
      this.logger.error(`Failed to read session file: ${err.message}`);
    }
    return '';
  }

  /**
   * Saves the session string to file
   * @param {string} session - Session string to save
   * @returns {boolean} Success status
   */
  saveSession(session) {
    try {
      fs.writeFileSync(this.sessionFilePath, session);
      this.logger.info('Session saved successfully');
      return true;
    } catch (err) {
      this.logger.error(`Failed to save session: ${err.message}`);
      return false;
    }
  }

  /**
   * Clears the saved session
   * @returns {boolean} Success status
   */
  clearSession() {
    try {
      if (fs.existsSync(this.sessionFilePath)) {
        fs.unlinkSync(this.sessionFilePath);
        this.logger.info('Session cleared successfully');
      }
      return true;
    } catch (err) {
      this.logger.error(`Failed to clear session: ${err.message}`);
      return false;
    }
  }
}

module.exports = SessionManager;