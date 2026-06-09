const Notification = require('../models/Notification');
const User = require('../models/User');

exports.sendNotification = async ({ userId, type, title, body, metadata }) => {
  try {
    await Notification.create({
      userId,
      type,
      title,
      body,
      metadata
    });
    // Here we could also integrate nodemailer or push notifications
    // depending on the type of notification (e.g., PAYMENT_SUCCESS -> Email)
  } catch (error) {
    console.error('Failed to send notification', error);
  }
};

exports.notifyAdmins = async ({ type, title, body, metadata }) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true });
    if (!admins.length) return;
    
    const notifications = admins.map(admin => ({
      userId: admin._id,
      type,
      title,
      body,
      metadata
    }));
    
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Failed to send notification to admins', error);
  }
};
