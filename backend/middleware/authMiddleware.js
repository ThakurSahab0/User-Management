const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT and attach user payload to request
const authenticateAndSetContext = (req, res, next) => {
  // Get the Authorization header from the request
  const authHeader = req.headers['authorization'];
  // Extract the token (assuming "Bearer TOKEN" format)
  const token = authHeader && authHeader.split(' ')[1];

  // If no token is provided, return 401 Unauthorized
  if (!token) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  // Verify the token using the JWT secret from environment variables
  jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
    // If verification fails (e.g., token is invalid or expired), return 403 Forbidden
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    // If token is valid, attach the decoded user payload to the request object
    // This payload contains user ID, email, roles, clientId, domainType, etc.
    req.user = userPayload;
    next(); // Proceed to the next middleware or route handler
  });
};

// Middleware to authorize users based on their roles
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure req.user is populated by the authenticateAndSetContext middleware
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: 'Access denied. User roles not found.' });
    }

    // Check if the user has any of the allowed roles
    const hasPermission = req.user.roles.some(role => allowedRoles.includes(role));

    // If the user has permission, proceed
    if (hasPermission) {
      next();
    } else {
      // If not, return 403 Forbidden
      res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
  };
};

module.exports = {
  authenticateAndSetContext,
  authorizeRoles,
};