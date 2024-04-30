const _ = require('lodash');
const { mongoose } = require('mongoose');

const { Schema } = mongoose;

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const bloodGroupSchema = new mongoose.Schema({
  bloodType: {
    type: String,
    required: [true, 'This field is required'],
    enum: bloodTypes,
  },
  count: {
    type: Number,
    required: [true, 'This field is required'],
    default: 0,
  },
});

const orderSchema = new Schema({
  bloodGroup: {
    type: [
      {
        type: bloodGroupSchema,
      },
    ],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    required: [true, 'This field is required'],
  },
  bloodBankID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: [true, 'This field is required'],
  },
  hospitalID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'This field is required'],
  },
  from: {
    type: String,
    enum: ['hospital', 'bank'],
    required: [true, 'This field is required and must be either "hospital" or "bank"'],
  },
  to: {
    type: String,
    enum: ['hospital', 'bank'],
    required: [true, 'This field is required and must be either "hospital" or "bank"'],
  },
  status: {
    type: String,
    enum: ['pending', 'reject', 'approved'],
    required: [true, "This field is required and must be either 'pending' or 'reject'or'approved'"],
  },
},
{
  toJSON: {
    transform: (doc, ret) => _.omit(ret, ['__v']),
  },
});
orderSchema.index({ userID: 1, BloodBankID: 1, hospitalID: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
