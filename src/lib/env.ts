export function getEnv() {
  return {
    MONGODB_URI: process.env.MONGODB_URI,
    ADMIN_TOKEN_SECRET: process.env.ADMIN_TOKEN_SECRET,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    PRIVATE_TOKEN_SECRET: process.env.PRIVATE_TOKEN_SECRET,
    PRIVATE_PASSWORD: process.env.PRIVATE_PASSWORD,
    MONGO_EXPRESS_URL: process.env.MONGO_EXPRESS_URL,
    ANALYTICS_SALT: process.env.ANALYTICS_SALT,
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}
