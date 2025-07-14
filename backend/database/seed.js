// backend/database/seed.js
// This script is used to populate initial data into your MongoDB database,
// such as a default HubCrafter admin user.

// Load environment variables from the .env file in the parent directory
require('dotenv').config({ path: __dirname + '/../.env' });

const mongoose = require('mongoose');
const User = require('../models/User'); // Import User model
const Client = require('../models/Client'); // Import Client model (if needed for seeding)
const bcrypt = require('bcrypt'); // For hashing passwords
const connectDB = require('../config/database'); // Database connection function

const seedDatabase = async () => {
  await connectDB(); // Ensure connection to MongoDB is established

  try {
    console.log('--- Starting Database Seeding ---');

    // 1. Create a default HubCrafter Admin user if one doesn't already exist
    console.log('Checking/Seeding HubCrafter Admin user...');
    // IMPORTANT: Replace 'admin@hubcrafter.com' with the actual email you want for your main admin
    const hubCrafterAdminEmail = 'admin@hubcrafter.com';
    const existingHubCrafterAdmin = await User.findOne({ email: hubCrafterAdminEmail });

    if (!existingHubCrafterAdmin) {
      // IMPORTANT: CHANGE 'hubcrafteradminpassword' to a strong, unique password!
      const hashedPassword = await bcrypt.hash('hubcrafteradminpassword', 10);
      const hubCrafterAdmin = new User({
        email: hubCrafterAdminEmail,
        passwordHash: hashedPassword,
        roles: ['Admin'], // Assign the 'Admin' role to this user
        clientId: null, // HubCrafter admins do not belong to a specific client
      });
      await hubCrafterAdmin.save();
      console.log(`HubCrafter Admin user created: ${hubCrafterAdminEmail}`);
    } else {
      console.log(`HubCrafter Admin user already exists: ${hubCrafterAdminEmail}`);
    }

    console.log('--- Database Seeding Complete! ---');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1); // Exit with a failure code if an error occurs
  } finally {
    // Close the MongoDB connection after seeding is done
    mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

seedDatabase(); // Execute the seeding function