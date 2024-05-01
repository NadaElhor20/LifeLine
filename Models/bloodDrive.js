const _ = require('lodash');
const { mongoose } = require('mongoose');
const { mobileRegex, landPhoneRegex } = require('../config');
const { Schema } = mongoose;

const bloodDriveSchema = new Schema({
  startDate: {
    type: Date,
    required: [true, 'This field is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'This field is required'],
  },
  phone: {
    type: String,
    required: [true, 'This field is required'],
    validate: {
      validator: function (value) {
        // Define a regular expression for phone number validation
        const landPhoneRegexExp = new RegExp(landPhoneRegex);
        const mobileRegexExp = new RegExp(mobileRegex);
        return landPhoneRegexExp.test(value) || mobileRegexExp.test(value);
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  description: {
    type: String,
    required: [true, 'This field is required'],
  },
  bloodBankID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: [true, 'This field is required'],
  },
});

const BloodDrive = mongoose.model('BloodDrive', bloodDriveSchema);

module.exports = BloodDrive;
