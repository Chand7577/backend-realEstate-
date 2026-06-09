require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');

// Connect Database
const connectDB = require('./src/config/db');
connectDB();

// Run Seeds
const seedConfig = require('./src/scripts/seedConfig');
seedConfig();

// Init Scheduled Jobs
const { initJobs } = require('./src/jobs/scheduler');
initJobs();

// Passport Config
require('./src/config/passport');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());

// Webhook route needs raw body parser for signature checking if doing it cleanly,
// but for standard we use express.json() for everything else.
// If webhook specific raw body is needed:
// app.use('/api/webhooks', express.raw({type: 'application/json'}), require('./src/routes/webhookRoutes'));
app.use('/api/webhooks', express.json(), require('./src/routes/webhookRoutes'));

app.use(express.json()); // Body parser
app.use(morgan('dev'));
app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/listings', require('./src/routes/listingRoutes'));
app.use('/api/leads', require('./src/routes/leadRoutes'));
app.use('/api/packages', require('./src/routes/packageRoutes'));
app.use('/api/payments', require('./src/routes/paymentRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/credits', require('./src/routes/creditRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// Error Handler Middleware
const errorHandler = require('./src/middlewares/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
