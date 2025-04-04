# ZLoa History Tracker

[한국어 설명서](./사용설명서.md)

Chrome extension for tracking and saving character data from zloa.net to Firebase database.

## Features

1. Adds a save button on zloa.net character search results
2. Extracts character data including stats and conversion scores
3. Saves data to Firebase Realtime Database for future analysis
4. Prevents duplicate data saving with same conversion score
5. Detects and prevents saving data with errors
6. Local cache for better performance and reduced API calls

## Installation for Users

1. **Clone or download this repository**
   - Download the latest release from [Releases](https://github.com/YOUR_USERNAME/ZLoaHistory-Extension/releases)
   - Or clone the repository and build it yourself (see Development Setup below)

2. **Install in Chrome**
   - Open `chrome://extensions/` in Chrome
   - Enable 'Developer mode' (toggle in the top-right corner)
   - Click 'Load unpacked'
   - Select the `dist` folder from the downloaded/built extension

3. **Configure your Firebase credentials**
   - Copy the `.env.example` file to `.env`
   - Add your Firebase credentials
   - Build the extension with `npm run build`

## Development Setup

1. Install dependencies
```
npm install
```

2. Configure .env file
```
FIREBASE_API_KEY=YOUR_API_KEY
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=your-project
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
FIREBASE_APP_ID=YOUR_APP_ID
```

3. Build
```
npm run build
```

4. Load in Chrome
   - Open `chrome://extensions/`
   - Enable 'Developer mode'
   - Click 'Load unpacked'
   - Select the generated `dist` folder

## Firebase Security Rules

For better security, use these Firebase rules:

```json
{
  "rules": {
    ".read": true,
    ".write": false,
    "characters": {
      "$server": {
        "$character": {
          ".read": true,
          ".write": true
        }
      }
    }
  }
}
```

These rules allow:
- Reading from anywhere in the database
- Writing only to specific character paths
- Prevents unwanted modifications to other parts of the database

## Usage

1. Visit zloa.net
2. Search for a character
3. On the results page, click 'Save Character Info'
4. Check the status of the save operation

## Rate Limiting

The extension implements rate limiting to prevent excessive Firebase usage:
- Maximum of 5 requests per second
- Local caching to reduce duplicate requests
- Skips saving if conversion score hasn't changed

## Data Structure

```javascript
{
  "charname": "CharacterName",
  "server": "ServerName",
  "converted_zp": 1234.56,
  "zp_score": 1234.56,   // For compatibility with older versions
  "temlv": 1680.0,
  "class": "ClassName",
  "build": "BuildName",
  "calculated_at": "CalculationTime",
  "observed_at": "SavedTime(ISO format)",
  "receipt": {
    "초월": 29.77,
    "장비": 52.88,
    // ... other receipt data
  }
}
```

## Notes

- This extension is for personal use and data collection
- Make sure to properly configure the .env file before deployment
- If you fork this project, you should create your own Firebase project
- Never commit your `.env` file or API keys to the repository
