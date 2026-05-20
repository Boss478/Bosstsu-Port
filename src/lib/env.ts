export function getEnv() {
  return {
    MONGODB_URI: process.env.MONGODB_URI,
    ADMIN_TOKEN_SECRET: process.env.ADMIN_TOKEN_SECRET,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    MONGO_EXPRESS_URL: process.env.MONGO_EXPRESS_URL,
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}
