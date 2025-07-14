const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  registerDomain: {
    type: String,
    required: true,
    unique: true, // Ensures each client has a unique registered domain
    lowercase: true,
    trim: true,
  },
  clientAdminEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  adminPhoneNo: {
    type: String,
    trim: true,
  },
  storeHostingPlatform: {
    type: String,
    trim: true,
  },
  applicationsUsed: {
    type: [String], // Stores a list of applications as an array of strings
    default: [],
  },
  orderVolumeMonthly: {
    type: Number,
    min: 0, // Ensures non-negative order volume
  },
  expectedReturnsCancellationsMonthly: {
    type: Number,
    min: 0, // Ensures non-negative return/cancellation numbers
  },
  operationalWHCities: {
    type: [String], // Stores a list of operational cities as an array of strings
    default: [],
  },
  status: {
    type: String,
    enum: ['pending_review', 'approved', 'rejected', 'onboarded'], // Defined possible states
    default: 'pending_review', // New clients start in this status
  },
  negotiationNotes: {
    type: String,
  },
}, {
  timestamps: true, // Mongoose automatically adds createdAt and updatedAt fields
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;