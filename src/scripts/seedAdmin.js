const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config({ path: '.env' });

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME
    });
    console.log('Connected to DB');

    // Delete old admin entries
    await User.deleteMany({ email: { $in: ['admin@luxeliving.com', 'admin2@luxeliving.com'] } });
    console.log('Deleted old admin entries.');

    // Add new test admin
    const hash = await bcrypt.hash('1234', 10);
    await User.updateOne(
      { email: 'admin@gmail.com' },
      { 
        $set: { 
          name: 'Super Admin', 
          password: hash, 
          role: 'admin', 
          isActive: true, 
          isEmailVerified: true 
        } 
      },
      { upsert: true }
    );
    console.log('Admin seeded: admin@gmail.com / 1234');
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
