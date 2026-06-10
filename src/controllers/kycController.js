const Kyc = require('../models/Kyc');

exports.submitKyc = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let kyc = await Kyc.findOne({ userId });

    if (kyc) {
      if (kyc.status === 'PENDING' || kyc.status === 'APPROVED') {
        return res.status(400).json({ success: false, message: `Cannot submit KYC. Current status is ${kyc.status}` });
      }
      
      // If REJECTED, we can re-submit
      if (kyc.status === 'REJECTED') {
        kyc.status = 'PENDING';
        kyc.submissionCount += 1;
        kyc.rejectReason = null;
        kyc.reviewer = null;
        kyc.reviewedAt = null;
        
        if (req.body.aadhaar) kyc.aadhaar = req.body.aadhaar;
        if (req.body.pan) kyc.pan = req.body.pan;
        if (req.body.address) kyc.address = req.body.address;
        if (req.body.email) kyc.email = req.body.email;
        if (req.body.phone) kyc.phone = req.body.phone;
        
        await kyc.save();
        return res.status(201).json({ success: true, message: 'KYC re-submitted successfully and is under review.', data: { kyc } });
      }
    }

    // Create new KYC
    kyc = new Kyc({
      userId,
      email: req.body.email,
      phone: req.body.phone,
      aadhaar: req.body.aadhaar,
      pan: req.body.pan,
      address: req.body.address,
      status: 'PENDING'
    });

    await kyc.save();
    res.status(201).json({ success: true, message: 'KYC submitted successfully and is under review.', data: { kyc } });

  } catch (error) {
    next(error);
  }
};

exports.getMyKyc = async (req, res, next) => {
  try {
    const kyc = await Kyc.findOne({ userId: req.user._id });
    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found' });
    }
    res.status(200).json({ success: true, data: { kyc } });
  } catch (error) {
    next(error);
  }
};

exports.editKyc = async (req, res, next) => {
  try {
    const kyc = await Kyc.findOne({ userId: req.user._id });
    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found' });
    }

    if (kyc.status !== 'REJECTED') {
      return res.status(400).json({ success: false, message: 'You can only edit KYC if it has been REJECTED.' });
    }

    if (req.body.aadhaar) kyc.aadhaar = req.body.aadhaar;
    if (req.body.pan) kyc.pan = req.body.pan;
    if (req.body.address) kyc.address = req.body.address;
    if (req.body.email) kyc.email = req.body.email;
    if (req.body.phone) kyc.phone = req.body.phone;

    await kyc.save();

    res.status(200).json({ success: true, message: 'KYC updated successfully. Please re-submit when ready.', data: { kyc } });
  } catch (error) {
    next(error);
  }
};
