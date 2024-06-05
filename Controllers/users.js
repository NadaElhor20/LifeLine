const Joi = require('joi');
const customError = require('../Helper/ErrorHandler.js');
const {mailRegex, passwordRegex, mobileRegex, govPattern, cityPattern } = require('../config');
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Custom  function to calculate Age
function calculateAge(birthDate) {
  var today = new Date();
  var birthDate = new Date(birthDate);
  var age = today.getFullYear() - birthDate.getFullYear();
  var monthDiff = today.getMonth() - birthDate.getMonth();
  // If the birth month has not occurred yet in the current year, subtract one from age
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Custom validation function to check birthDate
const birthDateValidator = (value, helpers) => {
  // Calculate the date 18 years ago
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

  if (value > eighteenYearsAgo) {
    return helpers.message('Birth date must be at least 18 years ago');
  }

  return value;
};

const schemaForPost = Joi.object({
  firstName: Joi.string().required().messages({
    'any.required': 'First name is required',
    'string.empty': 'First name cannot be empty',
  }),
  lastName: Joi.string().required().messages({
    'any.required': 'Last name is required',
    'string.empty': 'Last name cannot be empty',
  }),
  email: Joi.string().email().pattern(new RegExp(mailRegex)).required().messages({
    'any.required': 'Email is required',
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email cannot be empty',
  }),
  password: Joi.string().required().min(8).regex(new RegExp(passwordRegex)).messages({
    'string.min': 'Must have at least 8 characters',
    'object.regex': 'Must have at least 8 characters',
    'string.pattern.base': 'Password must include at least  special character,capital,small letter and number',
  }),
  birthDate: Joi.date().max('now').required().custom(birthDateValidator, 'Birth Date').messages({
    'any.required': 'Birth date is required',
    'date.base': 'Birth date must be a valid date',
    'date.max': 'Birth date must be in the past',
  }),
  gender: Joi.string().valid('m', 'f').required().messages({
    'any.required': 'Gender is required',
    'any.only': 'Gender must be either "m" or "f"',
  }),
  phone: Joi.string().pattern(new RegExp(mobileRegex)).required().messages({
    'any.required': 'Phone number is required',
    'string.pattern.base': 'Phone number must be a valid Egyptian phone number',
    'string.empty': 'Phone number cannot be empty',
  }),
  bloodType: Joi.string()
    .valid(...bloodTypes)
    .required()
    .messages({
      'any.required': 'Blood type is required',
      'any.only': 'Blood type must be one of the valid blood types',
    }),
  disease: Joi.array().items(Joi.string()).required(),
  donationTimes: Joi.number().integer().required(),
  gov: Joi.string().pattern(new RegExp(govPattern)).required().messages({
    'any.required': 'Governorate is required',
    'string.empty': 'Governorate cannot be empty',
    'string.pattern.base': 'Governorate must be a number between 1 and 28',
  }),
  city: Joi.string().pattern(new RegExp(cityPattern)).required().messages({
    'any.required': 'City is required',
    'string.empty': 'City cannot be empty',
    'string.pattern.base': 'City must be a number between 1 and 100',
  }),
});

const schemaForPatch = Joi.object({
  firstName: Joi.string().optional().messages({
    'any.required': 'First name is required',
    'string.empty': 'First name cannot be empty',
  }),
  lastName: Joi.string().optional().messages({
    'any.required': 'Last name is required',
    'string.empty': 'Last name cannot be empty',
  }),
  password: Joi.string().optional().min(8).regex(new RegExp(passwordRegex)).messages({
    'string.min': 'Must have at least 8 characters',
    'object.regex': 'Must have at least 8 characters',
    'string.pattern.base': 'Password must include at least  special character,capital,small letter and number',
  }),
  birthDate: Joi.date().max('now').optional().custom(birthDateValidator, 'Birth Date').messages({
    'any.required': 'Birth date is required',
    'date.base': 'Birth date must be a valid date',
    'date.max': 'Birth date must be in the past',
  }),
  gender: Joi.string().valid('m', 'f').optional().messages({
    'any.required': 'Gender is required',
    'any.only': 'Gender must be either "m" or "f"',
  }),
  phone: Joi.string().pattern(new RegExp(mobileRegex)).optional().messages({
    'any.required': 'Phone number is required',
    'string.pattern.base': 'Phone number must be a valid Egyptian phone number',
    'string.empty': 'Phone number cannot be empty',
  }),
  bloodType: Joi.string()
    .valid(...bloodTypes)
    .optional()
    .messages({
      'any.required': 'Blood type is required',
      'any.only': 'Blood type must be one of the valid blood types',
    }),
  disease: Joi.array().items(Joi.string()).optional(),
  donationTimes: Joi.number().integer().optional(),
  lastDonationDate: Joi.date().optional(),
  gov: Joi.string().pattern(new RegExp(govPattern)).optional().messages({
    'string.pattern.base': 'Governorate must be a number between 1 and 28',
  }),
  city: Joi.string().pattern(new RegExp(cityPattern)).optional().messages({
    'string.pattern.base': 'City must be a number between 1 and 100',
  }),
  receivedHistory: Joi.object({
    receivedBloodType: Joi.string().valid(...bloodTypes),
    receivedBloodDate: Joi.date(),
  })
    .and('receivedBloodType', 'receivedBloodDate')
    .messages({
      'object.and': 'Received blood type is required if received blood date is provided, and vice versa',
    })
    .optional(),
});

const validateRegisteredUser = async (req, res, next) => {
  try {
    await schemaForPost.validateAsync(req.body, {
      abortEarly: false,
    });
    next();
  } catch (error) {
    const err = new customError(
      'validation error',
      442,
      error.details.map((Error) => {
        return {
          key: Error.context.key,
          message: Error.message,
        };
      })
    );
    next(err);
  }
};

const validateUpdatedUser = async (req, res, next) => {
  try {
    await schemaForPatch.validateAsync(req.body, {
      abortEarly: false,
    });
    next();
  } catch (error) {
    const err = new customError(
      'validation error',
      442,
      error.details.map((Error) => {
        return {
          key: Error.context.key,
          message: Error.message,
        };
      })
    );
    next(err);
  }
};

module.exports = {
  validateRegisteredUser,
  validateUpdatedUser,
  calculateAge,
};
