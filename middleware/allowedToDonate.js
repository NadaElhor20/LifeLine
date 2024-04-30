const customError = require('../Helper/ErrorHandler.js');
const User = require('../Models/user.js');
const { criticalDiseases } = require('../config');
const _ = require('lodash');

// Calculate the difference in milliseconds between the two dates
function isLessThanThreeMonths(donationDate, lastDonationDate) {
   donationDate=donationDate?new Date(donationDate):new Date()
  const diffInMs = donationDate - lastDonationDate;

  // Calculate the number of milliseconds in a month (approximately)
  const msInMonth = 3 * 30 * 24 * 60 * 60 * 1000; // Assuming 30 days in a month

  // Compare the difference with the number of milliseconds in a month
  return diffInMs < msInMonth;
}



const AllowedDonation = async (req, res, next) => {
  const { userID } = req.query;
  const { donationDate } = req.body;
  try {
    if (!userID) throw new customError('No user ID provided', 400);
    const user = await User.findById(userID);
    if (!user) throw new customError("user didn't exist", 400);
    const { lastDonationDate, disease } = user;

    const differenceDonationPeriod = lastDonationDate?isLessThanThreeMonths(donationDate,lastDonationDate):false;
    const haveDisease = _.intersection(criticalDiseases, disease).length;
    if (differenceDonationPeriod || haveDisease) throw new customError("you didn't allowed to donate", 400);
    next();
  } catch (error) {
    if (error.name == 'Donation Not Allowed') throw new customError("you didn't allowed to donate", 400);
    next(error);
  }
};

module.exports = { AllowedDonation };
