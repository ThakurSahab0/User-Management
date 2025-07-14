const express = require('express');
const cors = require('cors'); // Import cors middleware

// Import route modules
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
// You will add more routes here as you build more features (e.g., orderRoutes)

const app = express();

// --- Middleware ---
// Enable CORS for all origins. In production, you should restrict this to your frontend's domain.
app.use(cors());

// Body parser middleware to parse JSON request bodies
app.use(express.json());

// --- Routes ---
// Basic health check route
app.get('/', (req, res) => {
  res.send('Welcome to the SAAS Backend API!');
});

// Mount specific route modules under their respective paths
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
// app.use('/api/orders', orderRoutes); // Example: Uncomment when you create this route

// --- Global Error Handler (Optional but Recommended) ---
// This middleware catches errors thrown in route handlers
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  res.status(500).send('Something broke on the server!'); // Send a generic error response
});

module.exports = app;