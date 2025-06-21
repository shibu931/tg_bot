# Telegram Automation Tool

A Node.js application that uses the Telegram MTProto protocol to automate sending messages to multiple groups or channels at scheduled intervals.

## Features

- **MTProto Authentication**: Log in using a regular Telegram user account (phone number and OTP)
- **Session Persistence**: Save authentication sessions to avoid re-entering OTP on restart
- **Scheduled Messaging**: Send messages at specific intervals or times using cron expressions
- **Multiple Targets**: Send to multiple groups, channels, or chats where the user is a member
- **Configurable**: All settings managed through a single config file
- **Logging**: Comprehensive logging of all sent messages with timestamps and statuses
- **Error Handling**: Graceful handling of rate limits and other Telegram API errors

## Prerequisites

- Node.js (v14 or higher)
- Telegram API credentials (API ID and API Hash)

## Setup Instructions

### 1. Get Telegram API Credentials

1. Visit [https://my.telegram.org/](https://my.telegram.org/) and log in with your Telegram account
2. Go to 'API development tools'
3. Create a new application (or use an existing one)
4. Note down your **API ID** and **API Hash**

### 2. Configure the Application

1. Clone or download this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Update the `.env` file with your API credentials:
   ```
   API_ID=your_api_id
   API_HASH=your_api_hash
   ```
4. Configure the `config.json` file with your settings:
   - Update the `phoneNumber` field with your Telegram phone number
   - Add your target groups/channels in the `targets` array
   - Set your desired message in the `message` field
   - Configure the scheduling settings

### 3. Run the Application

```
npm start
```

On first run, you'll be prompted to enter the authentication code sent to your Telegram account. After successful authentication, the session will be saved for future use.

## Configuration Options

### Auth Settings

```json
"auth": {
  "phoneNumber": "+1234567890",
  "apiId": "YOUR_API_ID",
  "apiHash": "YOUR_API_HASH"
}
```

### Messaging Settings

```json
"messaging": {
  "message": "Your message content here",
  "targets": [
    {
      "type": "group",
      "username": "group_username"
    },
    {
      "type": "channel",
      "username": "channel_username"
    },
    {
      "type": "chat",
      "id": 123456789
    }
  ]
}
```

### Scheduling Settings

#### Interval-based scheduling

```json
"scheduling": {
  "type": "interval",
  "value": 15,
  "unit": "minutes"
}
```

Supported units: `minutes`, `hours`, `days`

#### Cron-based scheduling

```json
"scheduling": {
  "type": "cron",
  "value": "0 8 * * *"
}
```

This example runs daily at 8:00 AM.

### Advanced Settings

```json
"advanced": {
  "sessionSavePath": "./session",
  "logLevel": "info",
  "retryAttempts": 3,
  "retryDelay": 5000
}
```

## Logging

Logs are written to both the console and a file named `telegram-bot.log` in the application directory.

## Security Notes

- Never share your API credentials or session files
- Be aware that automated messaging may violate Telegram's terms of service in some cases
- Use responsibly and respect rate limits to avoid account restrictions

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Ensure your API credentials are correct
   - Check that your phone number is in the correct format (with country code)

2. **Rate Limiting**
   - If you encounter rate limiting, increase the delay between messages
   - Consider reducing the frequency of scheduled messages

3. **Session Issues**
   - If you're having problems with saved sessions, delete the `session` directory and restart

## License

MIT