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
    }
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
