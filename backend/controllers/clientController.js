const Client = require('../models/Client'); // Import Mongoose Client model
const User = require('../models/User');     // Import Mongoose User model
const bcrypt = require('bcrypt');           // For password hashing
// const emailService = require('../services/emailService'); // Placeholder for email service

// Handles the registration of a new client
exports.registerClient = async (req, res) => {
  // Extract client details from the request body
  const {
    companyName, registerDomain, clientAdminEmail, adminPhoneNo,
    storeHostingPlatform, applicationsUsed, orderVolumeMonthly,
    expectedReturnsCancellationsMonthly, operationalWHCities
  } = req.body;

  try {
    // --- Basic Input Validation ---
    if (!companyName || !registerDomain || !clientAdminEmail) {
      return res.status(400).json({ message: 'Company Name, Register Domain, and Client Admin Email are required.' });
    }

    // Check if a client with this domain already exists
    const existingClient = await Client.findOne({ registerDomain });
    if (existingClient) {
      return res.status(409).json({ message: 'This domain is already registered by another client.' });
    }

    // --- Create New Client Document ---
    const newClient = new Client({
      companyName,
      registerDomain,
      clientAdminEmail,
      adminPhoneNo,
      storeHostingPlatform,
      // Convert comma-separated strings to arrays for storage
      applicationsUsed: applicationsUsed ? applicationsUsed.split(',').map(s => s.trim()) : [],
      orderVolumeMonthly,
      expectedReturnsCancellationsMonthly,
      operationalWHCities: operationalWHCities ? operationalWHCities.split(',').map(s => s.trim()) : [],
      status: 'pending_review', // New clients start with 'pending_review' status
    });

    await newClient.save(); // Save the new client document to MongoDB

    // --- Email Notifications (Conceptual) ---
    // In a real application, you'd integrate with an email service here.
    // await emailService.sendRegistrationConfirmation(clientAdminEmail, companyName);
    // await emailService.notifyHubCrafterAdminNewRegistration(companyName, registerDomain);

    res.status(201).json({ message: 'Client registration request submitted successfully. We will review your application and send an update via email.' });

  } catch (error) {
    console.error('Error registering client:', error);
    // Handle specific MongoDB duplicate key error for unique fields like registerDomain
    if (error.code === 11000) {
        return res.status(409).json({ message: 'A client with this domain already exists.' });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Retrieves all client requests that are in 'pending_review' status
exports.getPendingClientRequests = async (req, res) => {
  try {
    const pendingClients = await Client.find({ status: 'pending_review' });
    res.json(pendingClients); // Return the list of pending clients
  } catch (error) {
    console.error('Error fetching pending client requests:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Updates the status of a client (e.g., from pending to approved/onboarded)
exports.updateClientStatus = async (req, res) => {
  const { id } = req.params; // Get client ID from URL parameters
  const { newStatus, negotiationNotes } = req.body; // Get new status and notes from request body

  try {
    // --- Input Validation ---
    const validStatuses = ['pending_review', 'approved', 'rejected', 'onboarded'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    // Find the client by ID
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    // Update client's status and negotiation notes
    client.status = newStatus;
    client.negotiationNotes = negotiationNotes;
    await client.save(); // Save the updated client document

    // --- Special Logic for 'onboarded' status ---
    if (newStatus === 'onboarded') {
      // If the client is onboarded, ensure an initial client admin user exists
      const existingAdmin = await User.findOne({ email: client.clientAdminEmail, clientId: client._id });

      if (!existingAdmin) {
        // If no admin user exists for this client, create one
        const tempPassword = Math.random().toString(36).slice(-8); // Generate a temporary password
        const hashedPassword = await bcrypt.hash(tempPassword, 10); // Hash the temporary password

        const newClientAdmin = new User({
          email: client.clientAdminEmail,
          passwordHash: hashedPassword,
          clientId: client._id, // Link this user to the newly onboarded client
          roles: ['Admin', 'Client'], // Assign 'Admin' and 'Client' roles to this client's primary admin
        });
        await newClientAdmin.save();

        // --- Email Notification (Conceptual) ---
        // Send email to the new client admin with their temporary password or a password reset link
        // await emailService.sendClientOnboardingEmail(client.clientAdminEmail, client.companyName, tempPassword);
      }
    }

    // --- Email Notification (Conceptual) ---
    // Send email notification to the client about their status update
    // await emailService.sendClientStatusUpdate(client.clientAdminEmail, client.companyName, newStatus);

    res.json({ message: `Client status updated to ${newStatus}` });

  } catch (error) {
    console.error('Error updating client status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};