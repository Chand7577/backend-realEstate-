const mongoose = require('mongoose');
const Property = require('../models/Property');
const Service = require('../models/Service');
const creditService = require('../services/creditService');
const AppError = require('../utils/AppError');

exports.createProperty = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const creditCost = await creditService.getCreditCost('LIST_PROPERTY');

    // Create property document
    const newProperty = new Property({
      ...req.body,
      userId: req.user.id,
      status: 'PENDING_REVIEW',
      creditsUsed: creditCost
    });

    await newProperty.save({ session });

    // Deduct credits
    await creditService.deductCredits(
      req.user.id, 
      creditCost, 
      'PROPERTY_LISTING', 
      newProperty._id, 
      'Property', 
      'Listed a new property', 
      session
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: { property: newProperty }
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

exports.createService = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const creditCost = await creditService.getCreditCost('LIST_SERVICE');

    // Create service document
    const newService = new Service({
      ...req.body,
      userId: req.user.id,
      status: 'PENDING_REVIEW',
      creditsUsed: creditCost
    });

    await newService.save({ session });

    // Deduct credits
    await creditService.deductCredits(
      req.user.id, 
      creditCost, 
      'SERVICE_LISTING', 
      newService._id, 
      'Service', 
      'Listed a new service', 
      session
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: { service: newService }
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

exports.getProperties = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { status: 'ACTIVE' }; // Default public view
    // Add filters here if needed

    const properties = await Property.find(query).skip(skip).limit(limit).populate('userId', 'name email phone avatar');
    const total = await Property.countDocuments(query);

    res.status(200).json({
      success: true,
      data: { properties, total, page, limit }
    });
  } catch (err) {
    next(err);
  }
};

exports.getServices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { status: 'ACTIVE' };

    const services = await Service.find(query).skip(skip).limit(limit).populate('userId', 'name email phone avatar');
    const total = await Service.countDocuments(query);

    res.status(200).json({
      success: true,
      data: { services, total, page, limit }
    });
  } catch (err) {
    next(err);
  }
};
