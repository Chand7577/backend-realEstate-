const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return done(null, false, { message: 'Incorrect email or password.' });
    }

    if (!user.isActive) {
      return done(null, false, { message: 'Account is deactivated. Please contact support.' });
    }

    // if (!user.isEmailVerified) {
    //   return done(null, false, { message: 'Please verify your email address before logging in.' });
    // }

    // Check lockout
    if (user.isLocked()) {
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return done(null, false, { message: `Account locked due to multiple failed attempts. Please try again in ${waitMinutes} minutes.` });
    }

    // Google-only account check
    if (!user.password) {
      return done(null, false, { message: 'This account uses Google Login. Please sign in with Google.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 mins
      }
      await user.save();
      return done(null, false, { message: 'Incorrect email or password.' });
    }

    // Success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value.toLowerCase();
    
    // Check by googleId
    let user = await User.findOne({ googleId: profile.id });
    if (user) {
      if (!user.isActive) return done(null, false, { message: 'Account is deactivated.' });
      return done(null, user);
    }

    // Check by email
    user = await User.findOne({ email });
    if (user) {
      if (!user.isActive) return done(null, false, { message: 'Account is deactivated.' });
      user.googleId = profile.id;
      user.isEmailVerified = true;
      await user.save();
      return done(null, user);
    }

    // Create new Google user (Role will be empty, will need role selection later)
    user = new User({
      name: profile.displayName,
      email: email,
      googleId: profile.id,
      isEmailVerified: true,
      avatar: profile.photos[0]?.value,
      // Default to buyer temporarily or leave empty if mongoose allows enum bypass for unselected.
      // Wait, Mongoose requires 'role' per schema. We'll set it to 'buyer' as a safe default, or handle it in the controller.
      role: 'buyer' // We can prompt them to change it on first login if needed.
    });

    await user.save();
    return done(null, user);

  } catch (err) {
    return done(err);
  }
}));

module.exports = passport;
