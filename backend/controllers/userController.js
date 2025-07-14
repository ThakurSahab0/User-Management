const User = require('../models/User'); // Import Mongoose User model
const Client = require('../models/Client'); // Import Mongoose Client model
const bcrypt = require('bcrypt'); // For password hashing

// Handles the creation of a new user
exports.createUser = async (req, res) => {
  // Extract user details from the request body
  const { email, password, roles, accountType, clientId } = req.body;
  // Get the authenticated user who is making this request (from JWT payload)
  const { user: requestingUser } = req;

  try {
    // --- Basic Input Validation ---
    if (!email || !roles || roles.length === 0) {
      return res.status(400).json({ message: 'Email and roles are required.' });
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    // --- Domain and Role-Based Authorization & Client Assignment Logic ---
    const emailDomain = email.split('@')[1]; // Extract domain from the new user's email
    let userClientId = null; // This will store the ObjectId of the client this new user belongs to

    if (requestingUser.domainType === 'hubcrafter') {
      // If the requesting user is a HubCrafter admin:
      if (emailDomain === 'hubcrafter.com') {
        // HubCrafter admin is creating another HubCrafter user
        if (clientId) {
          return res.status(400).json({ message: 'HubCrafter users cannot be assigned to a client ID.' });
        }
        // No client ID needed for HubCrafter users
      } else {
        // HubCrafter admin is creating a user for a specific client
        if (!clientId) {
          return res.status(400).json({ message: 'Client ID is required for non-HubCrafter email domains.' });
        }
        // Verify the provided clientId and its domain
        const client = await Client.findById(clientId);
        if (!client || client.registerDomain !== emailDomain) {
          return res.status(400).json({ message: 'Email domain does not match the registered domain of the selected client.' });
        }
        userClientId = clientId; // Assign the provided client ID to the new user
      }
    } else if (requestingUser.domainType === 'client') {
      // If the requesting user is a Client admin:
      // They can only create users for their own client's domain
      if (requestingUser.clientId.toString() !== clientId && emailDomain !== requestingUser.clientDomain) {
        // Ensure the clientId provided (if any) matches their own client's ID,
        // and the email domain matches their client's domain.
        return res.status(403).json({ message: 'You can only create users for your own organization.' });
      }
      // Client admins cannot assign the 'Admin' role (which is typically for HubCrafter or top-level client admin)
      if (roles.includes('Admin')) {
        return res.status(403).json({ message: 'Client admins cannot assign the "Admin" role.' });
      }
      userClientId = requestingUser.clientId; // Automatically assign the current client's ID to the new user
    } else {
      // Any other domainType or unauthorized access
      return res.status(403).json({ message: 'Unauthorized to create users.' });
    }

    // --- Password Hashing ---
    let passwordHash = null;
    if (accountType === 'manual' && password) {
      passwordHash = await bcrypt.hash(password, 10); // Hash the password with 10 salt rounds
    } else if (accountType === 'manual' && !password) {
      return res.status(400).json({ message: 'Password is required for manual accounts.' });
    }

    // --- Create New User Document ---
    const newUser = new User({
      email,
      passwordHash,
      roles,
      clientId: userClientId, // Assign the determined client ID
      // ssoProvider and ssoId would be set during an SSO registration flow, not here
    });

    await newUser.save(); // Save the new user document to MongoDB

    res.status(201).json({ message: 'User created successfully', userId: newUser._id });

  } catch (error) {
    console.error('Error creating user:', error);
    // Handle specific MongoDB duplicate key error (code 11000) for unique fields like email
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
};