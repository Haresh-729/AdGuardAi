const express = require('express');
const cors = require('cors');
require('dotenv').config();

const morgan = require('morgan');
const http = require('http');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const uploadRoutes = require('./routes/upload');
const complianceRoutes = require('./routes/compliance');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

const keepAlive = require('./Services/keepAlive');

const app = express();
// app.use(morgan('dev'));

// Allow requests from specific origin (frontend domain)
// const allowedOrigins = ['https://shree-vidya-saraswati-pujan.netlify.app'];
const allowedOrigins = process.env.ALLOWED_ORIGINS;
// app.use(cors({
//     origin: ["*"],
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: false,
//   }));
app.use(cors({
    origin: function (origin, callback) {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  }));


app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'adGuardAi Server is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ads', complianceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        console.log('🚀 Starting adGuardAi Server...');
        
        // Create HTTP server from Express app
        const server = http.createServer(app);
        
        // Start the server
        server.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });

        // keepAlive();

        // Graceful shutdown handling
        process.on('SIGTERM', async () => {
            console.log('\n🛑 SIGTERM received, shutting down gracefully...');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            console.log('\n🛑 SIGINT received, shutting down gracefully...');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
