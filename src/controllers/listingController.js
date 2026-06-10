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
      status: req.body.status || 'ACTIVE',
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
  try {
    const newService = new Service({
      ...req.body,
      serviceType: req.user.serviceSubType || req.body.serviceType || 'vastu', // Auto-infer from user profile, fallback to vastu
      userId: req.user.id,
      status: 'ACTIVE' // Bypassing review and credits per user request
    });

    await newService.save();

    res.status(201).json({
      success: true,
      data: { service: newService }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyServices = async (req, res, next) => {
  try {
    const services = await Service.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: { services }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return next(new AppError('Service not found', 404));
    }
    
    if (service.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to update this service', 403));
    }

    const updatedService = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: { service: updatedService }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return next(new AppError('Service not found', 404));
    }
    
    if (service.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to delete this service', 403));
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      data: null
    });
  } catch (err) {
    next(err);
  }
};

exports.getProperties = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { status: 'ACTIVE' }; // Default public view
    
    // Add filters
    if (req.query.isFeatured === 'true') {
      query.isFeatured = true;
    }
    if (req.query.propertyType && req.query.propertyType !== 'all') {
      query.propertyType = req.query.propertyType;
    }
    if (req.query.listingType) {
      query.listingType = req.query.listingType;
    }
    if (req.query.maxPrice) {
      query.price = { $lte: parseInt(req.query.maxPrice, 10) };
    }
    if (req.query.bedrooms) {
      const bedsVal = parseInt(req.query.bedrooms, 10);
      if (bedsVal >= 5) {
        query.bedrooms = { $gte: 5 };
      } else {
        query.bedrooms = bedsVal;
      }
    }
    if (req.query.bathrooms) {
      const bathsVal = parseInt(req.query.bathrooms, 10);
      if (bathsVal >= 4) {
        query.bathrooms = { $gte: 4 };
      } else {
        query.bathrooms = bathsVal;
      }
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'location.address': searchRegex },
        { 'location.city': searchRegex }
      ];
    }

    let sortObj = { createdAt: -1 };
    if (req.query.sort === 'priceAsc') {
      sortObj = { price: 1 };
    } else if (req.query.sort === 'priceDesc') {
      sortObj = { price: -1 };
    }

    const properties = await Property.find(query).sort(sortObj).skip(skip).limit(limit).populate('userId', 'name email phone avatar');
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

exports.getMyProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: { properties }
    });
  } catch (err) {
    next(err);
  }
};

exports.getPropertyDetail = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate('userId', 'name email phone avatar role');
    if (!property) {
      return next(new AppError('Property not found', 404));
    }
    res.status(200).json({
      success: true,
      data: { property }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);
    if (!property) {
      return next(new AppError('Property not found', 404));
    }
    
    // Check ownership
    if (property.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to update this property', 403));
    }
    
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: { property: updatedProperty }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return next(new AppError('Property not found', 404));
    }
    
    // Check ownership
    if (property.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to delete this property', 403));
    }
    
    await Property.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    
    const fileUrls = req.files.map(file => file.path);
    
    res.status(200).json({
      success: true,
      data: { urls: fileUrls }
    });
  } catch (err) {
    next(err);
  }
};

exports.featureProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return next(new AppError('Property not found', 404));
    }
    
    // Check ownership
    if (property.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to feature this property', 403));
    }

    if (property.status !== 'ACTIVE') {
      return next(new AppError('Only active properties can be featured', 400));
    }

    // IGNORING CREDITS AS REQUESTED BY USER
    // creditService.deductCredits(...)
    
    property.isFeatured = true;
    
    // Set to 7 days from now
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    property.featuredUntil = expiry;

    await property.save();

    res.status(200).json({
      success: true,
      message: 'Property featured successfully',
      data: { property }
    });
  } catch (err) {
    next(err);
  }
};

exports.unfeatureProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return next(new AppError('Property not found', 404));
    }
    
    // Check ownership
    if (property.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to unfeature this property', 403));
    }

    property.isFeatured = false;
    property.featuredUntil = null;

    await property.save();

    res.status(200).json({
      success: true,
      message: 'Property unfeatured successfully',
      data: { property }
    });
  } catch (err) {
    next(err);
  }
};

exports.getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.status(200).json({ success: true, data: { service } });
  } catch (err) {
    next(err);
  }
};
