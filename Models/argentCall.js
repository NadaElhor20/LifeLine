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

const argentCallSchema = new Schema({
  hospitalID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'This field is required'],
  },
  gov: {
    type: String,
    required: [true, 'This field is required'],
    enum: {
      values: Array.from({ length: 28 }, (_, i) => (i + 1).toString()),
      message: 'Value for gov must be between 1 and 28',
    },
  },
  city: {
    type: String,
    required: [true, 'This field is required'],
    enum: {
      values: Array.from({ length: 100 }, (_, i) => (i + 1).toString()),
      message: 'Value for gov must be between 1 and 100',
    },
  },
  description: {
    type: String,
    required: [true, 'This field is required'],
  },
  createDate: {
    type: Date,
    required: [true, 'This field is required'],
  },
  bloodGroup: {
    type: [
      {
        type: bloodGroupSchema,
      },
    ],
    required: true
  }
});

const ArgentCall = mongoose.model('ArgentCall', argentCallSchema);

module.exports = ArgentCall;
