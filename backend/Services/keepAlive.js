const keepAlive = () => {
  const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (before 15-minute sleep)
  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
  
  const pingServer = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/health`);
      const timestamp = new Date().toLocaleString();
      
      if (response.ok) {
        console.log(`✅ Keep-alive ping successful - ${timestamp}`);
      } else {
        console.log(`⚠️ Keep-alive ping failed with status ${response.status} - ${timestamp}`);
      }
    } catch (error) {
      console.log(`❌ Keep-alive ping error: ${error.message} - ${new Date().toLocaleString()}`);
    }
  };

  // Only run in production
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 Keep-alive service started');
    
    // Initial ping after 1 minute
    setTimeout(pingServer, 60000);
    
    // Regular pings every 14 minutes
    setInterval(pingServer, PING_INTERVAL);
  }
};

module.exports = keepAlive;