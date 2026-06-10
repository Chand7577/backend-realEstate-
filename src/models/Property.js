const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  propertyType: { type: String, enum: ['apartment', 'villa', 'penthouse', 'plot', 'commercial', 'pg'], required: true },
  listingType: { type: String, enum: ['SALE', 'RENT', 'LEASE'], required: true },
  price: { type: Number, required: true, validate: Number.isInteger }, // Use paise if preferred, otherwise large int
  
  // Property Specifications
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  totalArea: { type: Number },
  furnishing: { type: String, enum: ['fully', 'semi', 'unfurnished'] },
  yearBuilt: { type: Number },
  lotSize: { type: String }, // e.g., "0.8 Acres"
  propertyTax: { type: Number },
  parking: { type: String }, // e.g., "3-Car Garage"
  
  clientDetails: {
    name: { type: String },
    phone: { type: String },
    email: { type: String },
    showContactToPublic: { type: Boolean, default: false }
  },

  location: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] } // [longitude, latitude]
    }
  },
  amenities: [{ type: String }],
  images: [{ type: String }],
  videoUrl: { type: String },
  status: { 
    type: String, 
    enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'EXPIRED', 'SOLD'], 
    default: 'DRAFT' 
  },
  isFeatured: { type: Boolean, default: false },
  featuredUntil: { type: Date },
  creditsUsed: { type: Number, default: 0, validate: Number.isInteger },
  expiresAt: { type: Date },
  viewCount: { type: Number, default: 0, validate: Number.isInteger }
}, { timestamps: true });

propertySchema.index({ userId: 1, status: 1 });
propertySchema.index({ status: 1, listingType: 1 });
propertySchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Property', propertySchema);
