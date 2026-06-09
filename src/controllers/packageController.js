const Package = require('../models/Package');
const AppError = require('../utils/AppError');

exports.getAllPackages = async (req, res, next) => {
  try {
    const packages = await Package.find({ isActive: true });
    res.status(200).json({
      status: 'success',
      results: packages.length,
      data: { packages }
    });
  } catch (err) {
    next(err);
  }
};

exports.getAdminPackages = async (req, res, next) => {
  try {
    const packages = await Package.find({}); // Fetch all including inactive
    res.status(200).json({
      status: 'success',
      results: packages.length,
      data: { packages }
    });
  } catch (err) {
    next(err);
  }
};

exports.createPackage = async (req, res, next) => {
  try {
    const newPackage = await Package.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { package: newPackage }
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg) {
      return next(new AppError('Package not found', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { package: pkg }
    });
  } catch (err) {
    next(err);
  }
};
