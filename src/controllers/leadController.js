const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Property = require('../models/Property');
const Service = require('../models/Service');
const creditService = require('../services/creditService');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');

exports.submitLead = async (req, res, next) => {
  try {
    const { listingId, listingModel, name, phone, email, message } = req.body;
    
    // Determine target user
    const Model = listingModel === 'Property' ? Property : Service;
    const listing = await Model.findById(listingId);
    
    if (!listing) return next(new AppError('Listing not found', 404));

    const newLead = await Lead.create({
      buyerId: req.user.id,
      targetUserId: listing.userId,
      listingId,
      listingModel,
      buyerSnapshot: { name, phone, email, message },
      isLocked: true,
      status: 'NEW'
    });

    // Fire & forget notification
    notificationService.sendNotification({
      userId: listing.userId,
      type: 'LEAD_RECEIVED',
      title: 'New Lead Received',
      body: `You have received a new lead for your ${listingModel.toLowerCase()}.`
    }).catch(console.error);

    res.status(201).json({
      success: true,
      data: { lead: newLead }
    });
  } catch (err) {
    next(err);
  }
};

exports.getInbox = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const leads = await Lead.find({ targetUserId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Lead.countDocuments({ targetUserId: req.user.id });

    // Mask locked leads
    const processedLeads = leads.map(lead => {
      if (lead.isLocked) {
        lead.buyerSnapshot = {
          name: 'Locked Contact',
          phone: '**********',
          email: 'locked@example.com',
          message: 'Unlock to view message'
        };
      }
      return lead;
    });

    res.status(200).json({
      success: true,
      data: { leads: processedLeads, total, page, limit }
    });
  } catch (err) {
    next(err);
  }
};

exports.unlockLead = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const lead = await Lead.findOne({ _id: req.params.id, targetUserId: req.user.id }).session(session);
    if (!lead) throw new AppError('Lead not found or unauthorized', 404);
    if (!lead.isLocked) throw new AppError('Lead is already unlocked', 400);

    const creditCost = await creditService.getCreditCost('UNLOCK_LEAD');

    // Deduct credits
    await creditService.deductCredits(
      req.user.id, 
      creditCost, 
      'LEAD_UNLOCK', 
      lead._id, 
      'Lead', 
      'Unlocked a buyer lead', 
      session
    );

    lead.isLocked = false;
    lead.unlockedBy = req.user.id;
    lead.unlockedAt = new Date();
    lead.creditsUsed = creditCost;
    lead.status = 'VIEWED';

    await lead.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: { lead }
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
