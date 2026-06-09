const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  propertyType: { type: String, enum: ['apartment', 'villa', 'penthouse', 'commercial'], required: true },
  price: { type: Number, required: true },
  
  // Property Specifications
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  totalArea: { type: Number },
  furnishing: { type: String, enum: ['fully', 'semi', 'unfurnished'] },
  
  // Advanced Details
  yearBuilt: { type: Number },
  lotSize: { type: String },
  hoaFees: { type: Number },
  parking: { type: String },
  schoolDistrict: { type: String },
  
  // Location
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  
  // Amenities & Media
  amenities: [{ type: String }],
  featuredImage: { type: String },
  gallery: [{ type: String }],
  videoUrl: { type: String },

  // System
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['available', 'sold', 'rented'], default: 'available' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
