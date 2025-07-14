const User = require('../models/User'); // Import the Mongoose User model
const Client = require('../models/Client'); // Import the Mongoose Client model
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken'); // For creating JSON Web Tokens
// const emailService = require('../services/emailService'); // Placeholder for email service

// Handles user login
exports.login = async (req, res) => {
  const { email, password } = req.body; // Extract email and password from request body

  try {
    // 1. Find the user by their email in the database
    const user = await User.findOne({ email });

    // If no user is found with the given email, return 401 Unauthorized
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 2. Compare password (only for manually created accounts)
    if (user.passwordHash) { // Check if the user has a hashed password (i.e., not an SSO account)
      const isMatch = await bcrypt.compare(password, user.passwordHash); // Compare provided password with stored hash
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' }); // Passwords do not match
      }
    } else {
      // If user has no passwordHash, it's an SSO account. Instruct them to use SSO.
      return res.status(401).json({ message: 'This is an SSO account. Please use your SSO provider to log in.' });
    }

    // 3. Determine user's domain type and client information
    let domainType = 'client'; // Default to 'client' type
    let clientDomain = null;
    let clientStatus = null;

    // Check if the email belongs to the HubCrafter domain
    // IMPORTANT: Replace 'hubcrafter.com' with your actual HubCrafter domain
    if (email.endsWith('@hubcrafter.com')) {
        domainType = 'hubcrafter';
        clientDomain = 'hubcrafter.com'; // Explicitly set for HubCrafter
    } else if (user.clientId) { // If user has a clientId, they belong to a client
        // Find the associated client document
        const client = await Client.findById(user.clientId);
        if (!client) {
            // If client ID is present but client document not found, it's a data inconsistency
            return res.status(403).json({ message: 'Associated client not found for this user.' });
        }
        clientDomain = client.registerDomain; // Get the client's registered domain
        clientStatus = client.status; // Get the client's onboarding status

        // Deny login if the client account is not yet onboarded/active
        if (clientStatus !== 'onboarded') {
            return res.status(403).json({ message: 'Your client account is not active yet. Please contact support.' });
        }
        // Optional: Further check if the user's email domain matches the client's registered domain
        if (!email.endsWith(`@${clientDomain}`)) {
             console.warn(`User ${email} has clientId ${user.clientId} but email domain doesn't match client's registered domain ${clientDomain}`);
             // You might choose to deny login here or just log the anomaly
        }
    } else {
        // This case should ideally not happen if clientId is null only for HubCrafter users
        // It indicates an unassigned user trying to log in
        return res.status(403).json({ message: 'Unauthorized access: User not assigned to a client or HubCrafter.' });
    }

    // 4. Update the user's last login timestamp
    user.lastLoginAt = new Date();
    await user.save(); // Save the updated user document

    // 5. Generate a JSON Web Token (JWT) for the authenticated user
    const token = jwt.sign(
      {
        id: user._id, // MongoDB's default ID field
        email: user.email,
        roles: user.roles, // User's roles array
        clientId: user.clientId, // The client's ObjectId (null for HubCrafter users)
        domainType: domainType, // 'hubcrafter' or 'client'
        clientDomain: clientDomain // The actual domain of the client (or 'hubcrafter.com')
      },
      process.env.JWT_SECRET, // Your secret key for signing the token
      { expiresIn: '1h' } // Token expiration time (e.g., 1 hour)
    );

    // Send a successful login response with the token and user information
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
        clientId: user.clientId,
        domainType,
        clientDomain
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Placeholder for user registration logic
// This route is typically for internal HubCrafter admin use or initial client admin setup,
// not for public self-registration.
exports.register = async (req, res) => {
  res.status(501).json({ message: 'Registration not yet implemented for this endpoint.' });
};

// Placeholder for forgot password logic (generating reset token and sending email)
exports.forgotPassword = async (req, res) => {
  res.status(501).json({ message: 'Forgot password not yet implemented.' });
};

// Placeholder for reset password logic (verifying token and updating password)
exports.resetPassword = async (req, res) => {
  res.status(501).json({ message: 'Reset password not yet implemented.' });
};