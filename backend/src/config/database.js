import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Remove deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leave-management');

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    
    // More detailed error info
    if (error.message.includes('ESERVFAIL')) {
      console.error('DNS resolution failed. Possible issues:');
      console.error('1. Check your internet connection');
      console.error('2. MongoDB Atlas cluster might be paused');
      console.error('3. Try using the alternative connection string format');
    }
    
    process.exit(1);
  }
};

export default connectDB;