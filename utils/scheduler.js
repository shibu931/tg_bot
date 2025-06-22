const cron = require('node-cron');

/**
 * Handles scheduling of message sending tasks
 * Provides methods to schedule tasks using cron expressions
 */
class Scheduler {
  /**
   * Creates a new Scheduler instance
   * @param {Object} logger - Winston logger instance
   */
  constructor(logger) {
    this.logger = logger;
    this.scheduledTasks = [];
  }

  /**
   * Schedules a task using a cron expression
   * @param {string} cronExpression - Valid cron expression
   * @param {Function} task - Function to execute on schedule
   * @param {Object} options - Options for node-cron
   * @returns {Object} Scheduled task object
   */
  scheduleTask(cronExpression, task, options = {}) {
    try {
      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid cron expression: ${cronExpression}`);
      }

      this.logger.info(`Scheduling task with cron expression: ${cronExpression}`);
      
      // Schedule the task
      const scheduledTask = cron.schedule(cronExpression, async () => {
        this.logger.info(`Running scheduled task: ${cronExpression}`);
        try {
          await task();
        } catch (err) {
          this.logger.error(`Error in scheduled task: ${err.message}`);
        }
      }, options);
      
      this.scheduledTasks.push(scheduledTask);
      return scheduledTask;
    } catch (err) {
      this.logger.error(`Failed to schedule task: ${err.message}`);
      throw err;
    }
  }

  /**
   * Converts interval settings to a cron expression
   * @param {number} value - Interval value
   * @param {string} unit - Interval unit (minutes, hours, days)
   * @returns {string} Cron expression
   */
  intervalToCron(value, unit) {
    switch (unit) {
      case 'minutes':
        if (value < 1 || value > 59) {
          throw new Error('Invalid minute interval. Must be between 1 and 59.');
        }
        return `*/${value} * * * *`;
      
      case 'hours':
        if (value < 1 || value > 23) {
          throw new Error('Invalid hour interval. Must be between 1 and 23.');
        }
        return `0 */${value} * * *`;
      
      case 'days':
        if (value < 1 || value > 30) {
          throw new Error('Invalid day interval. Must be between 1 and 30.');
        }
        return `0 0 */${value} * *`;
      
      default:
        throw new Error(`Unsupported interval unit: ${unit}`);
    }
  }

  /**
   * Converts specific daily time to a cron expression
   * @param {string} time - Time in 24-hour format (HH:MM)
   * @returns {string} Cron expression
   */
  dailyTimeToCron(time) {
    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(time)) {
      throw new Error('Invalid time format. Must be in 24-hour format (HH:MM).');
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create cron expression for specific time daily
    return `${minutes} ${hours} * * *`;
  }
  
  /**
   * Converts multiple daily times to cron expressions and schedules tasks for each
   * @param {Array<string>} times - Array of times in 24-hour format (HH:MM)
   * @param {Function} task - Function to execute on schedule
   * @param {Object} options - Options for node-cron
   * @returns {Array<Object>} Array of scheduled task objects
   */
  scheduleMultipleDailyTimes(times, task, options = {}) {
    if (!Array.isArray(times) || times.length === 0) {
      throw new Error('Times must be a non-empty array of time strings');
    }
    
    const scheduledTasks = [];
    
    for (const time of times) {
      const cronExpression = this.dailyTimeToCron(time);
      this.logger.info(`Scheduling task for daily time: ${time} (${cronExpression})`);
      const scheduledTask = this.scheduleTask(cronExpression, task, options);
      scheduledTasks.push(scheduledTask);
    }
    
    return scheduledTasks;
  }

  /**
   * Stops all scheduled tasks
   */
  stopAllTasks() {
    this.logger.info(`Stopping ${this.scheduledTasks.length} scheduled tasks`);
    this.scheduledTasks.forEach(task => task.stop());
    this.scheduledTasks = [];
  }
}

module.exports = Scheduler;