const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/reputly_demo';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB подключена');
  } catch (err) {
    console.error('❌ Ошибка подключения к MongoDB:', err.message);
    // Continue without terminating for demo purposes
  }
};

module.exports = connectDB;
