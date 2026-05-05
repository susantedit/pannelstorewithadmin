import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: 'Digital key' },
    price: { type: String, required: true },
    status: { type: String, default: 'Available' },
    description: { type: String, default: '' },
    img: { type: String, default: '' },
    packages: {
      type: [
        {
          label: { type: String, required: true },
          price: { type: String, required: true },
          originalPrice: { type: String, default: '' }
        }
      ],
      default: []
    },
    // Ratings & reviews
    ratings: {
      type: [{
        userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        userName:  { type: String, default: '' },
        stars:     { type: Number, min: 1, max: 5, required: true },
        comment:   { type: String, default: '', maxlength: 300 },
        createdAt: { type: Date, default: Date.now }
      }],
      default: []
    },
    avgRating:    { type: Number, default: 0 },
    ratingCount:  { type: Number, default: 0 },
    // Conversion tracking
    viewCount:    { type: Number, default: 0 },
    orderCount:   { type: Number, default: 0 },
    // Sort order for admin reordering (lower = higher in list)
    sortOrder:    { type: Number, default: 9999 },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
