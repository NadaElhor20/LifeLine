const _ = require('lodash');
const { mongoose } = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const util = require('util');
const { Schema } = mongoose;
const { privateKey, saltRounds, passwordRegex, mobileRegex } = require('../config');
const customError = require('../Helper/ErrorHandler');
const signInToken = util.promisify(jwt.sign);
const validate = util.promisify(jwt.verify);

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const receivedHistorySchema = new mongoose.Schema({
  receivedBloodType: {
    type: String,
    enum: bloodTypes, // Define your blood types enum
    required: [
      function () {
        return this.receivedHistory && !!this.receivedHistory.receivedBloodDate;
      },
      'Received blood type is required if received blood date is provided',
    ],
  },
  receivedBloodDate: {
    type: Date,
    required: [
      function () {
        return this.receivedHistory && !!this.receivedHistory.receivedBloodType;
      },
      'Received blood date is required if received blood type is provided',
    ],
  },
});

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'This field is required'],
    },
    lastName: {
      type: String,
      required: [true, 'This field is required'],
    },
    email: {
      type: String,
      required: [true, 'This field is required'],
      index: true,
      unique: true,
      validate: {
        validator: function (email) {
          // Custom validation function to check uniqueness
          return User.findOne({ email }).then((user) => !user); // Returns true if email is unique
        },
        message: 'This email already exist', // Custom error message
      },
    },
    password: {
      type: String,
      required: [true, 'This field is required'],
      validate: {
        validator: function (value) {
          // Define a regular expression for phone number validation
          const passwordRegexExp=new RegExp(passwordRegex);
          return passwordRegexExp.test(value);
        },
        message: (props) => `${props.value} is not a valid password!`,
      },
    },
    birthDate: {
      type: Date,
      required: [true, 'This field is required'],
      validate: {
        validator: function (value) {
          // Calculate the date 18 years ago
          const eighteenYearsAgo = new Date();
          eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

          // Check if the birth date is less than 18 years ago
          return value <= eighteenYearsAgo;
        },
        message: (props) => `${props.value} is not at least 18 years old!`,
      },
    },
    gender: {
      type: String,
      required: [true, 'This field is required'],
      enum: ['m', 'f'],
    },
    phone: {
      type: String,
      required: [true, 'This field is required'],
      validate: {
        validator: function (value) {
          // Define a regular expression for phone number validation
          const mobileRegexExp=new RegExp(mobileRegex);
          return mobileRegexExp.test(value);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    bloodType: {
      type: String,
      required: [true, 'This field is required'],
      enum: bloodTypes,
    },
    disease: {
      type: [
        {
          type: String,
        },
      ],
      required: false,
      default:[]
    },
    donationTimes: {
      type: Number,
      required: true,
    },
    lastDonationDate: {
      type: Date,
      required: false,
    },
    gov: {
      type: String,
      required: [true, 'This field is required'],
      enum: {
        values: Array.from({ length: 28 }, (_, i) => (i + 1).toString()),
        message: 'Value for gov must be between 1 and 28'
      }
    },
    city: {
      type: String,
      required: [true, 'This field is required'],
      enum: {
        values:Array.from({ length: 100 }, (_, i) => (i + 1).toString()),
        message: 'Value for gov must be between 1 and 100'
      }
    },
    receivedHistory: [receivedHistorySchema],
  },
  {
    toJSON: {
      transform: (doc, ret) => _.omit(ret, ['__v', 'password']),
    },
  }
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, +saltRounds);
  }
  next();
});

userSchema.methods.checkPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

userSchema.methods.generateToken = function () {
  return signInToken({ id: this.id }, privateKey, { expiresIn: '24h' });
};

userSchema.statics.getEntityFromToken = async function (token) {
  const User = this;
  const { id } = await validate(token, privateKey);
  const user = await User.findById(id);
  return user;
};

// Define a pre-save hook to handle uniqueness validation for disease field
userSchema.pre('save', async function (next) {
  if (!this.isModified('disease')) return next(); // Skip validation if disease field is not modified

  const uniqueDiseases = new Set(this.disease); // Convert to Set to remove duplicates
  if (uniqueDiseases.size !== this.disease.length) {
    const error = new customError('Disease list contains duplicate values', 422);
    return next(error); // Return error if duplicates are found
  }

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
