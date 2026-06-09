const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'your_super_secret_access_key');
    
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }
    
    if (!currentUser.isActive) {
      return next(new AppError('This user account has been deactivated.', 401));
    }

    req.user = currentUser;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired! Please refresh your token.', 401));
    }
    next(err);
  }
};

exports.hasRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

exports.isVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return next(new AppError('Please verify your email to access this route', 403));
  }
  next();
};

exports.creditParticipant = (req, res, next) => {
  const roles = ['seller', 'agent', 'service_provider'];
  if (!roles.includes(req.user.role)) {
    return next(new AppError('Credit operations are only available to sellers, agents, and service providers', 403));
  }
  next();
};
