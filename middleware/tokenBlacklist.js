const redis = require('redis');
require('dotenv').config();


// Create the Redis client instance
const client = redis.createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
  }
});

client.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Connect the Redis client
client.connect().then(() => {
  console.log('Connected to Redis');
});

// Add token to Redis blacklist
const blacklistToken = async (token) => {
  try {
    // Add token to Redis with an expiration time
    await client.set(token, 'blacklisted', 'EX', 3600);
  } catch (err) {
    console.error('Error blacklisting token:', err);
  }
};

// Check if the token is blacklisted in Redis
const isTokenBlacklisted = async (token) => {
  try {
    const result = await client.get(token);
    // console.log("🚀 ~ isTokenBlacklisted ~ result:", result);
    
    if (result === null) {
      return false; // Token is not blacklisted
    }
    return result === 'blacklisted'; // Return true if blacklisted, otherwise false
    
  } catch (err) {
    console.error('Error checking token blacklist status:', err);
    return false; // Default to false if there's an error
  }
};


module.exports = {
  blacklistToken,
  isTokenBlacklisted,
};