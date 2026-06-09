const mongoose = require('mongoose');
const CreditCostConfig = require('../models/CreditCostConfig');

const seedConfig = async () => {
  try {
    const count = await CreditCostConfig.countDocuments();
    if (count === 0) {
      console.log('Seeding CreditCostConfig with default values...');
      await CreditCostConfig.insertMany([
        { action: 'LIST_PROPERTY', creditCost: 10, applicableRoles: ['seller', 'agent'], description: 'Cost to list a single property' },
        { action: 'LIST_SERVICE', creditCost: 20, applicableRoles: ['service_provider'], description: 'Cost to list a service portfolio' },
        { action: 'UNLOCK_LEAD', creditCost: 5, applicableRoles: ['seller', 'agent', 'service_provider'], description: 'Cost to unlock buyer contact details' },
        { action: 'FEATURE_LISTING', creditCost: 50, applicableRoles: ['seller', 'agent', 'service_provider'], description: 'Cost to feature a listing for 7 days' },
        { action: 'RELIST_PROPERTY', creditCost: 5, applicableRoles: ['seller', 'agent'], description: 'Cost to relist an expired property' }
      ]);
      console.log('CreditCostConfig seeding complete.');
    }
  } catch (err) {
    console.error('Failed to seed config:', err);
  }
};

module.exports = seedConfig;
