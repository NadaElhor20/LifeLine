const customError = require('../Helper/ErrorHandler.js');
const _ = require('lodash');



const validateOrderData = async (req, res, next) => {
  const requestBody = req.body;
  try {
    const requiredFields = ["bloodGroup", "bloodBankID", "hospitalID", "from", "to"];
    const requestBodyFields = Object.keys(requestBody);
    const difference = _.difference(requiredFields, requestBodyFields);

    if (!_.isEmpty(difference)) {
      const missingFields = difference.join(', ');
      const errorMessage = `Missing required fields: ${missingFields}`;
      throw new customError(errorMessage, 400);
    }
    next();
  } catch (error) {
    next(error);
  }
};
module.exports = { validateOrderData };
