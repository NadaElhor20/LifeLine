const _ = require('lodash');
const { mongoose } = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const util = require('util');
const { Schema } = mongoose;
const { privateKey, saltRounds ,passwordRegex,landPhoneRegex} = require('../config');
const signInToken = util.promisify(jwt.sign);
const validate = util.promisify(jwt.verify);

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

const hospitalSchema = new Schema(
  {
    name: {
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
          return Hospital.findOne({ email }).then((Hospital) => !Hospital); // Returns true if email is unique
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
    phone: {
      type: String,
      required: [true, 'This field is required'],
      validate: {
        validator: function (value) {
          // Define a regular expression for phone number validation
          const landPhoneRegexExp=new RegExp(landPhoneRegex);
          return landPhoneRegexExp.test(value);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
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
        values: Array.from({ length: 100 }, (_, i) => (i + 1).toString()),
        message: 'Value for gov must be between 1 and 100'
      }
    },
    addressDescription: {
      type: String,
      required: [true, 'This field is required'],
    },
    bloodGroup: {
      type: [
        {
          type: bloodGroupSchema,
        },
      ],
      required: true,
      default: [
        { bloodType: 'A+', count: 0 },
        { bloodType: 'A-', count: 0 },
        { bloodType: 'B+', count: 0 },
        { bloodType: 'B-', count: 0 },
        { bloodType: 'AB+', count: 0 },
        { bloodType: 'AB-', count: 0 },
        { bloodType: 'O+', count: 0 },
        { bloodType: 'O-', count: 0 },
      ],
    },
    isOwner:{
      type: String,
      required: [true, 'This field is required'],
      default:"hospital"
    }
  },
  {
    toJSON: {
      transform: (doc, ret) => _.omit(ret, ['__v', 'password']),
    },
  }
);

hospitalSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, +saltRounds);
  }
  next();
});

hospitalSchema.methods.checkPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

hospitalSchema.methods.generateToken = function () {
  return signInToken({ id: this.id }, privateKey, { expiresIn: '24h' });
};

hospitalSchema.statics.getEntityFromToken = async function (token) {
  const Hospital = this;
  const { id } = await validate(token, privateKey);
  const hospital = await Hospital.findById(id);
  return hospital;
};





const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
