const express = require('express');
require('express-async-errors');
const _ = require('lodash');
const router = express.Router();
const { validateRegisteredBloodBank, validateUpdatedBloodBank } = require('../Controllers/bloodBank.js');
const { AuthorizedBloodBank } = require('../middleware/authorization.js');
const customError = require('../Helper/ErrorHandler.js');
const BloodBank = require('../Models/bloodBank.js');
const User = require('../Models/user.js');
const Hospital = require('../Models/hospital.js');

router.post('/', validateRegisteredBloodBank, async (req, res) => {
  const { name, email, password, phone, gov, addressDescription } = req.body;
  const bloodBank = new BloodBank({ name, email, password, phone, gov, addressDescription });
  const createdBloodBank = await bloodBank.save();
  res.status(200).send(createdBloodBank);
});

router.post('/signIn', async (req, res) => {
  const { email, password } = req.body;
  const bloodBank = await BloodBank.findOne({ email });
  if (!bloodBank) throw new customError('invalid email or password', 401);
  const match = await bloodBank.checkPassword(password);
  if (!match) throw new customError('invalid email or password', 401);
  const token = await bloodBank.generateToken();
  console.info('BloodBank login successfully');
  res.status(200).send({ token, bloodBankID: bloodBank._id });
});

router.get('/profile', AuthorizedBloodBank, async (req, res) => {
  const authentication = req.headers.authentication;
  const bloodBank = await BloodBank.getEntityFromToken(authentication);
  res.status(200).send({ bloodBank });
});

router.patch('/:id', validateUpdatedBloodBank, AuthorizedBloodBank, async (req, res) => {
  const { id } = req.params;
  const { bloodGroup, ...editedValues } = req.body; // Destructure bloodGroup and other edited values
  const { bloodGroup: BloodBankBloodGroup } = await BloodBank.findById(id, { bloodGroup: 1 });
  const arrayUpdates = [];
  let updated;

  // Merge and update bloodGroup if present in the request body
  if (bloodGroup) {
    const mergedBloodGroup = _.chain(bloodGroup)
      .concat(BloodBankBloodGroup) // Concatenate existing bloodGroup with modified bloodGroup
      .groupBy('bloodType')
      .map((values, bloodType) => ({
        bloodType,
        count: _.sumBy(values, 'count') > 0 ? _.sumBy(values, 'count') : 0,
      }))
      .value();

    arrayUpdates.push(BloodBank.findByIdAndUpdate(id, { $set: { bloodGroup: mergedBloodGroup } }, { new: true, runValidators: true }));
  }

  // Update non-array attributes
  if (!_.isEmpty(editedValues)) {
    updated = await BloodBank.findByIdAndUpdate(id, { $set: editedValues }, { new: true, runValidators: true });
  }
  // Wait for all array updates to complete
  if (arrayUpdates.length > 0) {
    const arrayUpdatedResults = await Promise.all(arrayUpdates);
    updated = arrayUpdatedResults[arrayUpdatedResults.length - 1];
  }

  res.send({ updated });
});

router.get('/lists', async (req, res) => {
  let gov;
  const { userID, hospitalID, bloodBankID } = req.query;
  if (userID) ({ gov } = await User.findById(userID));
  else if (hospitalID) ({ gov } = await Hospital.findById(hospitalID));
  const searchCriteria = bloodBankID ? {} : { gov };
  const BloodBankList = await BloodBank.find(searchCriteria);
  res.status(200).send(BloodBankList);
});

module.exports = router;
