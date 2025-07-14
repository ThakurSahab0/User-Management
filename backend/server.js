// Load environment variables from .env file
require('dotenv').config({ path: './.env' });

// Import the main Express application instance
const app = require('./app');

// Import the database connection function
const connectDB = require('./config/database');

// Connect to MongoDB
connectDB();

// Define the port for the server to listen on
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

// Start the Express server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});