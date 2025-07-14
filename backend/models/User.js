const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Ensures email addresses are unique across all users
    lowercase: true, // Stores email in lowercase
    trim: true, // Removes whitespace from both ends of a string
  },
  passwordHash: {
    type: String,
    // This field will be null for users authenticated via SSO (Microsoft/Google)
    // Required only if accountType is 'manual', enforced in controller logic
  },
  ssoProvider: {
    type: String, // e.g., 'microsoft', 'google'
    enum: ['microsoft', 'google', null], // Only allowed values
    default: null,
  },
  ssoId: {
    type: String, // Unique ID provided by the SSO provider
    sparse: true, // Allows multiple documents to have null for this field
    // Ensures uniqueness for non-null values of ssoId combined with ssoProvider
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId, // References the _id of a Client document
    ref: 'Client', // Specifies the model to which this ObjectId refers
    default: null, // Null for HubCrafter internal users
  },
  roles: {
    type: [String], // An array of strings, e.g., ['Admin', 'Client', 'Viewer']
    required: true,
    default: ['Viewer'], // Default role for new users if not specified
  },
  isActive: {
    type: Boolean,
    default: true, // Users are active by default
  },
  lastLoginAt: {
    type: Date, // Timestamp of the last successful login
  },
}, {
  timestamps: true, // Mongoose automatically adds createdAt and updatedAt fields
});

// Create a compound unique index for ssoProvider and ssoId
// This prevents duplicate SSO users from the same provider.
// `partialFilterExpression` ensures the index only applies where ssoProvider exists and is not null,
// allowing multiple manual users (where ssoProvider is null) without conflicting.
userSchema.index({ ssoProvider: 1, ssoId: 1 }, { unique: true, partialFilterExpression: { ssoProvider: { $exists: true, $ne: null } } });

const User = mongoose.model('User', userSchema);

module.exports = User;