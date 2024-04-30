const express = require('express');
require('express-async-errors');
const _ = require('lodash');
const router = express.Router();
const User = require('../Models/user.js');
const Donate = require('../Models/bloodBag');
const Hospital = require('../Models/hospital.js');
const { AuthorizedUser, AuthorizedActor } = require('../middleware/authorization.js');
const { AllowedDonation } = require('../middleware/allowedToDonate.js');
const BloodBank = require('../Models/bloodBank.js');

router.get('/', AuthorizedUser, AllowedDonation, async (req, res) => {
  res.status(200).send('allowed to donate');
});
router.post('/Add', AuthorizedUser, AllowedDonation, async (req, res) => {
  const { userID } = req.query;
  const { donationDate, hospitalID, bloodBankID } = req.body;
  const { bloodType } = await User.findById(userID, { bloodType: 1 });
  const donate = new Donate({ bloodType, donationDate, hospitalID, bloodBankID, userID });
  const userDonated = await donate.save();
  if (userDonated) {
    await User.findByIdAndUpdate(userID, {
      $set: { lastDonationDate: donationDate },
      $inc: { donationTimes: 1 },
    });
    if (hospitalID) {
      await Hospital.findByIdAndUpdate(
        hospitalID,
        {
          $inc: { 'bloodGroup.$[elem].count': 1 },
        },
        {
          arrayFilters: [{ 'elem.bloodType': bloodType }],
        }
      );
    }
    if (bloodBankID) {
      await BloodBank.findByIdAndUpdate(
        bloodBankID,
        {
          $inc: { 'bloodGroup.$[elem].count': 1 },
        },
        {
          arrayFilters: [{ 'elem.bloodType': bloodType }],
        }
      );
    }
  }
  res.status(200).send(userDonated);
});
router.get('/bagsLists', AuthorizedActor, async (req, res) => {
  const { userID, hospitalID, bloodBankID } = req.query;
  let donatedBagsList, mappedDonatedBagsList;
  if (userID) {
    donatedBagsList = await Donate.find({ userID }).populate([
      { path: 'hospitalID', select: ['name', 'addressDescription', 'phone'] },
      { path: 'bloodBankID', select: ['name', 'addressDescription', 'phone'] },
    ]);
    mappedDonatedBagsList = _.map(donatedBagsList, ({ donationDate, hospitalID, bloodBankID }) => ({
      donationDate,
      hospital: _.pick(hospitalID, ['name', 'phone', 'addressDescription']),
      bloodBank: _.pick(bloodBankID, ['name', 'phone', 'addressDescription']),
    }));
  } else if (hospitalID) {
    donatedBagsList = await Donate.find({ hospitalID }).populate('userID', ['firstName', 'lastName', 'phone', 'bloodType']);
    mappedDonatedBagsList = _.map(donatedBagsList, ({ donationDate, userID }) => {
      const fullName = `${userID.firstName} ${userID.lastName}`;
      return {
        donationDate,
        ..._.pick(userID, ['phone', 'bloodType']),
        fullName,
      };
    });
  } else if (bloodBankID) {
    donatedBagsList = await Donate.find({ bloodBankID }).populate('userID', ['firstName', 'lastName', 'phone', 'bloodType']);
    mappedDonatedBagsList = _.map(donatedBagsList, ({ donationDate, userID }) => {
      const fullName = `${userID.firstName} ${userID.lastName}`;
      return {
        donationDate,
        ..._.pick(userID, ['phone', 'bloodType']),
        fullName,
      };
    });
  }
  res.status(200).send(mappedDonatedBagsList);
});

module.exports = router;
