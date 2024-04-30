const Joi = require('joi');
const customError = require('../Helper/ErrorHandler.js');
const { passwordRegex, landPhoneRegex, govPattern } = require('../config.js');
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const schemaForPost = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'First name is required',
    'string.empty': 'First name cannot be empty',
  }),
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required',
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email cannot be empty',
  }),
  password: Joi.string().required().min(8).regex(new RegExp(passwordRegex)).messages({
    'string.min': 'Must have at least 8 characters',
    'object.regex': 'Must have at least 8 characters',
    'string.pattern.base': 'Password must include at least  special character,capital,small letter and number',
  }),
  phone: Joi.string().pattern(new RegExp(landPhoneRegex)).required().messages({
    'any.required': 'Phone number is required',
    'string.pattern.base': 'Phone number must be a valid Egyptian phone number',
    'string.empty': 'Phone number cannot be empty',
  }),
  gov: Joi.string().pattern(new RegExp(govPattern)).required().messages({
    'any.required': 'Governorate is required',
    'string.empty': 'Governorate cannot be empty',
    'string.pattern.base': 'Governorate must be a number between 1 and 28',
  }),
  addressDescription: Joi.string().optional().messages({
    'string.empty': 'address Description cannot be empty',
  }),
  bloodGroup: Joi.array().items(
      Joi.object({
        bloodType: Joi.string()
          .valid(...bloodTypes)
          .required(),
        count: Joi.number().required(),
      }).length(2) // Ensure each object has exactly two properties
    ).unique((a, b) => a.bloodType === b.bloodType) // Ensure bloodType is unique across all elements
    .min(1) // Ensure there is at least one object in the array
    .messages({
      'array.min': 'At least one blood group object is required',
      'object.length': 'Each blood group object must have exactly two properties (bloodType and count)',
    })
    .optional(),
});
const schemaForPatch = Joi.object({
  name: Joi.string().optional().messages({
    'string.empty': 'First name cannot be empty',
  }),
  password: Joi.string().optional().min(8).regex(new RegExp(passwordRegex)).messages({
    'string.min': 'Must have at least 8 characters',
    'object.regex': 'Must have at least 8 characters',
    'string.pattern.base': 'Password must include at least  special character,capital,small letter and number',
  }),
  phone: Joi.string().pattern(new RegExp(landPhoneRegex)).optional().messages({
    'string.pattern.base': 'Phone number must be a valid Egyptian phone number',
    'string.empty': 'Phone number cannot be empty',
  }),
  gov: Joi.string().pattern(new RegExp(govPattern)).optional().messages({
    'string.pattern.base': 'Governorate must be a number between 1 and 28',
  }),
  addressDescription: Joi.string().optional().messages({
    'string.empty': 'address Description cannot be empty',
  }),
  bloodGroup: Joi.array()
    .items(
      Joi.object({
        bloodType: Joi.string()
          .valid(...bloodTypes)
          .required(),
        count: Joi.number().optional(),
      }).length(2) // Ensure each object has exactly two properties
    ).unique((a, b) => a.bloodType === b.bloodType) // Ensure bloodType is unique across all elements
    .min(1) // Ensure there is at least one object in the array
    .messages({
      'array.min': 'At least one blood group object is required',
      'object.length': 'Each blood group object must have exactly two properties (bloodType and count)',
    })
    .optional(),
});

const validateRegisteredBloodBank = async (req, res, next) => {
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

const validateUpdatedBloodBank = async (req, res, next) => {
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
  validateRegisteredBloodBank,
  validateUpdatedBloodBank,
};
