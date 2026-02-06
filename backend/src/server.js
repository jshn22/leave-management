import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import testRoutes from './routes/testRoutes.js';
import { AppError, globalErrorHandler } from './utils/errorHandler.js';
import { seedDatabase } from './utils/seedDatabase.js';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://leave-management-tevz.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/tests', testRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leave-management')
  .then(() => {
    console.log('✅ MongoDB connected');
    seedDatabase().then(() => {
      console.log('✅ Database seeding complete');
    }).catch(err => {
      console.error('⚠️ Database seeding error:', err.message);
    });
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please kill the process or use a different port.`);
        process.exit(1);
      }
      throw err;
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});
