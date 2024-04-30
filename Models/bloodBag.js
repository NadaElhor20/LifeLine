const _ = require('lodash');
const { mongoose } = require('mongoose');

const { Schema } = mongoose;

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const bloodBagSchema = new Schema({
  bloodType: {
    type: String,
    required: [true, 'This field is required'],
    enum: bloodTypes,
  },
  donationDate: {
    type: Date,
    required: [true, 'This field is required'],
  },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bloodBankID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: function () {
      return !this.hospitalID; // Make bloodBankID required if hospitalID is not provided
    },
  },
  hospitalID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: function () {
      return !this.bloodBankID; // Make hospitalID required if bloodBankID is not provided
    },
  },
});
bloodBagSchema.index({ userID: 1, BloodBankID: 1, hospitalID: 1 });

const BloodBag = mongoose.model('BloodBag', bloodBagSchema);

module.exports = BloodBag;
