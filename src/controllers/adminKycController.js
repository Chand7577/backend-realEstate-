const Kyc = require('../models/Kyc');

exports.getAllKyc = async (req, res, next) => {
  try {
    const { status, role, serviceSubType, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build user match query if search, role, or serviceSubType are provided
    let userMatch = {};
    if (role) userMatch.role = role;
    if (serviceSubType) userMatch.serviceSubType = serviceSubType;
    if (search) {
      userMatch.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build KYC query
    let kycQuery = {};
    if (status) kycQuery.status = status;

    // Use aggregation to allow filtering by populated user fields
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      }
    ];

    if (Object.keys(userMatch).length > 0) {
      // Convert userMatch keys to match the joined document
      let matchUserStage = {};
      for (const key in userMatch) {
        if (key === '$or') {
          matchUserStage.$or = userMatch.$or.map(cond => {
            const mappedCond = {};
            for (const k in cond) {
              mappedCond[`user.${k}`] = cond[k];
            }
            return mappedCond;
          });
        } else {
          matchUserStage[`user.${key}`] = userMatch[key];
        }
      }
      pipeline.push({ $match: matchUserStage });
    }

    if (Object.keys(kycQuery).length > 0) {
      pipeline.push({ $match: kycQuery });
    }

    const sortStage = {
      $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };
    pipeline.push(sortStage);

    // Facet for pagination and total count
    pipeline.push({
      $facet: {
        metadata: [ { $count: "total" } ],
        data: [ { $skip: skip }, { $limit: limitNum } ]
      }
    });

    const results = await Kyc.aggregate(pipeline);
    
    const total = results[0].metadata[0] ? results[0].metadata[0].total : 0;
    const kycs = results[0].data;

    res.status(200).json({
      success: true,
      data: {
        kycs,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getKycById = async (req, res, next) => {
  try {
    const kyc = await Kyc.findById(req.params.id).populate('userId', 'name email phone role serviceSubType avatar isActive');
    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found' });
    }
    res.status(200).json({ success: true, data: { kyc } });
  } catch (error) {
    next(error);
  }
};

exports.approveKyc = async (req, res, next) => {
  try {
    const kyc = await Kyc.findById(req.params.id);
    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found' });
    }

    if (kyc.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `KYC is ${kyc.status}, cannot approve.` });
    }

    kyc.status = 'APPROVED';
    kyc.reviewer = req.user._id;
    kyc.reviewedAt = new Date();
    await kyc.save();

    res.status(200).json({ success: true, message: 'KYC approved successfully.', data: { kyc } });
  } catch (error) {
    next(error);
  }
};

exports.rejectKyc = async (req, res, next) => {
  try {
    const { rejectReason } = req.body;
    if (!rejectReason) {
      return res.status(400).json({ success: false, message: 'rejectReason is required to reject KYC.' });
    }

    const kyc = await Kyc.findById(req.params.id);
    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found' });
    }

    if (kyc.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `KYC is ${kyc.status}, cannot reject.` });
    }

    kyc.status = 'REJECTED';
    kyc.rejectReason = rejectReason;
    kyc.reviewer = req.user._id;
    kyc.reviewedAt = new Date();
    await kyc.save();

    res.status(200).json({ success: true, message: 'KYC rejected.', data: { kyc } });
  } catch (error) {
    next(error);
  }
};
