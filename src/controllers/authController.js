const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const passport = require('passport');

const generateTokens = async (user) => {
  const payload = { userId: user._id, role: user.role, serviceSubType: user.serviceSubType };
  
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'secret', {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m'
  });
  
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  
  user.hashedRefreshToken = hashedRefreshToken;
  await user.save();
  
  return { accessToken, refreshToken };
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, serviceSubType } = req.body;
    
    if (await User.findOne({ email })) {
      return next(new AppError('Email already in use', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      serviceSubType
    });

    const tokens = await generateTokens(newUser);
    
    newUser.password = undefined;
    res.status(201).json({
      success: true,
      data: { user: newUser, ...tokens }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = (req, res, next) => {
  passport.authenticate('local', { session: false }, async (err, user, info) => {
    if (err) return next(err);
    if (!user) return next(new AppError(info.message || 'Authentication failed', 401));

    try {
      const tokens = await generateTokens(user);
      user.password = undefined;
      res.status(200).json({ success: true, data: { user, ...tokens } });
    } catch (tokenErr) {
      next(tokenErr);
    }
  })(req, res, next);
};

exports.googleCallback = async (req, res, next) => {
  try {
    const tokens = await generateTokens(req.user);
    // Redirect to frontend with tokens in URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/oauth-callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&userId=${req.user._id}`);
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken, userId } = req.body;
    if (!refreshToken || !userId) return next(new AppError('Refresh token and userId required', 400));

    const user = await User.findById(userId);
    if (!user || !user.hashedRefreshToken) return next(new AppError('Invalid refresh token', 401));

    const isValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!isValid) return next(new AppError('Invalid refresh token', 401));

    const payload = { userId: user._id, role: user.role, serviceSubType: user.serviceSubType };
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'secret', {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m'
    });

    res.status(200).json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.hashedRefreshToken = undefined;
      await user.save();
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  res.status(200).json({ success: true, data: { user: req.user } });
};
