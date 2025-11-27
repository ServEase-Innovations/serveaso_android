const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// -------------------------------
// LOAD ENV BASED ON APP_ENV
// -------------------------------

const APP_ENV = process.env.APP_ENV || 'development';
const envFile = `.env.${APP_ENV}`;
const envPath = path.resolve(__dirname, envFile);

// If the env file exists, load it
if (fs.existsSync(envPath)) {
  console.log(`💡 Loading environment: ${envFile}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`⚠️ Environment file "${envFile}" not found. Falling back to .env`);
  dotenv.config(); // load default .env
}

// -------------------------------
// METRO DEFAULT CONFIG
// -------------------------------

const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
