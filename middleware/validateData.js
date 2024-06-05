const customError = require('../Helper/ErrorHandler.js');
const _ = require('lodash');

const validateData = async (req, res, next) => {
  const { baseUrl, body: requestBody } = req;

  try {
    // Define required fields based on the baseUrl
    let requiredFields;
    if (baseUrl === '/order') {
      requiredFields = ['bloodGroup', 'bloodBankID', 'hospitalID', 'from', 'to'];
    } else if (baseUrl === '/bloodDrive') {
      requiredFields = ['startDate', 'endDate', 'phone', 'description', 'bloodBankID'];
    } else if (baseUrl === '/argentCall') {
      requiredFields = ['hospitalID', 'gov', 'city', 'description', 'createDate', 'bloodGroup'];
    }

    // Check for missing fields
    const missingFields = requiredFields.filter((field) => !requestBody.hasOwnProperty(field));

    if (missingFields.length > 0) {
      throw new customError(`Missing required fields: ${missingFields.join(', ')}`, 400);
    }

    // Specific validation for date fields if they exist
    if (requiredFields.includes('startDate') && requiredFields.includes('endDate')) {
      const { startDate, endDate } = requestBody;
      if (new Date(startDate) > new Date(endDate)) {
        throw new customError('Start date cannot be later than end date.', 400);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validateData };
