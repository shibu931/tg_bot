/**
 * Handles message sending functionality
 * Provides methods to send messages to Telegram targets
 */
class Messenger {
  /**
   * Creates a new Messenger instance
   * @param {Object} client - Telegram client instance
   * @param {Object} logger - Winston logger instance
   */
  constructor(client, logger) {
    this.client = client;
    this.logger = logger;
  }

  /**
   * Sends a message to a specific target
   * @param {Object} target - Target object with type and identifier
   * @param {string} message - Message content to send
   * @returns {Object} Result object with status and details
   */
  async sendMessage(target, message) {
    try {
      let entity;
      
      if (target.type === 'chat' && target.id) {
        entity = target.id;
      } else if (target.username) {
        entity = target.username;
      } else {
        throw new Error('Invalid target configuration');
      }
      
      const result = await this.client.sendMessage(entity, { message });
      
      this.logger.info(`Message sent successfully to ${target.type} ${target.username || target.id}`);
      return { 
        success: true, 
        target, 
        messageId: result.id,
        timestamp: new Date().toISOString() 
      };
    } catch (err) {
      // Handle specific error types
      if (err.message.includes('FLOOD_WAIT')) {
        const waitTime = this._extractFloodWaitTime(err.message);
        this.logger.warn(`Rate limited! Need to wait ${waitTime} seconds before sending to ${target.type} ${target.username || target.id}`);
        return { 
          success: false, 
          target, 
          error: 'RATE_LIMITED',
          waitTime,
          timestamp: new Date().toISOString() 
        };
      }
      
      this.logger.error(`Failed to send message to ${target.type} ${target.username || target.id}: ${err.message}`);
      return { 
        success: false, 
        target, 
        error: err.message, 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * Sends messages to all targets in the provided array
   * @param {Array} targets - Array of target objects
   * @param {string} message - Message content to send
   * @param {number} delayBetweenMessages - Delay in ms between messages
   * @returns {Array} Array of result objects
   */
  async sendMessagesToAllTargets(targets, message, delayBetweenMessages = 2000) {
    this.logger.info(`Starting to send messages to ${targets.length} targets`);
    
    const results = [];
    
    for (const target of targets) {
      const result = await this.sendMessage(target, message);
      results.push(result);
      
      // If rate limited, wait the required time plus a small buffer
      if (result.error === 'RATE_LIMITED' && result.waitTime) {
        const waitMs = (result.waitTime * 1000) + 1000; // Convert to ms and add 1s buffer
        this.logger.info(`Waiting ${waitMs/1000} seconds due to rate limiting`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      } else {
        // Add a small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, delayBetweenMessages));
      }
    }
    
    // Log results
    const successCount = results.filter(r => r.success).length;
    this.logger.info(`Completed sending messages. Success: ${successCount}/${targets.length}`);
    
    return results;
  }

  /**
   * Extracts wait time from flood wait error message
   * @private
   * @param {string} errorMessage - Error message from Telegram
   * @returns {number} Wait time in seconds
   */
  _extractFloodWaitTime(errorMessage) {
    const match = errorMessage.match(/FLOOD_WAIT_(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return 60; // Default to 60 seconds if we can't parse the wait time
  }
}

module.exports = Messenger;