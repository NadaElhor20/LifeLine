require('dotenv').config();
const RequiredEnv = ['JWT_SECRET', 'DB_URL', 'PORT', 'MOBILE_REGEX','LAND_PHONE_REGEX','PASSWORD_REGEX','CRITICAL_DISEASES','GOV_PATTERN','CITY_PATTERN'];

const missedEnv = RequiredEnv.filter((envName) => !process.env[envName]);

if (missedEnv.length) throw new Error(`The Enviroment variables not found ${missedEnv}`);

module.exports = {
  privateKey: process.env.JWT_SECRET,
  saltRounds: process.env.SALT_ROUNDS || 7,
  mongoUrl: process.env.DB_URL,
  port: process.env.PORT,
  landPhoneRegex: process.env.LAND_PHONE_REGEX,
  mobileRegex: process.env.MOBILE_REGEX,
  passwordRegex: process.env.PASSWORD_REGEX,
  criticalDiseases:process.env.CRITICAL_DISEASES,
  govPattern:process.env.GOV_PATTERN,
  cityPattern:process.env.CITY_PATTERN
};
