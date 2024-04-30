const express = require('express');
require('express-async-errors');
const _ = require('lodash');
const router = express.Router();
const { validateRegisteredHospital, validateUpdatedHospital } = require('../Controllers/hospital.js');
const { AuthorizedHospital } = require('../middleware/authorization.js');
const customError = require('../Helper/ErrorHandler.js');
const Hospital = require('../Models/hospital.js');
const User = require('../Models/user.js');
const BloodBank = require('../Models/bloodBank');

router.post('/', validateRegisteredHospital, async (req, res) => {
  const { name, email, password, phone, gov, city, addressDescription } = req.body;
  const hospital = new Hospital({ name, email, password, phone, gov, city, addressDescription });
  const createdHospital = await hospital.save();
  res.status(200).send(createdHospital);
});

router.post('/signIn', async (req, res) => {
  const { email, password } = req.body;
  const hospital = await Hospital.findOne({ email });
  if (!hospital) throw new customError('invalid email or password', 401);
  const match = await hospital.checkPassword(password);
  if (!match) throw new customError('invalid email or password', 401);
  const token = await hospital.generateToken();
  console.info('hospital login successfully');
  res.status(200).send({ token, hospitalID: hospital._id });
});

router.get('/profile', AuthorizedHospital, async (req, res) => {
  const authentication = req.headers.authentication;
  const hospital = await Hospital.getEntityFromToken(authentication);
  res.status(200).send({ hospital });
});

router.patch('/:id', validateUpdatedHospital, AuthorizedHospital, async (req, res) => {
  const { id } = req.params;
  const { bloodGroup, ...editedValues } = req.body; // Destructure bloodGroup and other edited values
  const { bloodGroup: hospitalBloodGroup } = await Hospital.findById(id, { bloodGroup: 1 });
  const arrayUpdates = [];
  let updated;

  // Merge and update bloodGroup if present in the request body
  if (bloodGroup) {
    const mergedBloodGroup = _.chain(bloodGroup)
      .concat(hospitalBloodGroup) // Concatenate existing bloodGroup with modified bloodGroup
      .groupBy('bloodType')
      .map((values, bloodType) => ({
        bloodType,
        count: _.sumBy(values, 'count') > 0 ? _.sumBy(values, 'count') : 0,
      }))
      .value();

    arrayUpdates.push(Hospital.findByIdAndUpdate(id, { $set: { bloodGroup: mergedBloodGroup } }, { new: true, runValidators: true }));
  }

  // Update non-array attributes
  if (!_.isEmpty(editedValues)) {
    updated = await Hospital.findByIdAndUpdate(id, { $set: editedValues }, { new: true, runValidators: true });
  }
  // Wait for all array updates to complete
  if (arrayUpdates.length > 0) {
    const arrayUpdatedResults = await Promise.all(arrayUpdates);
    updated = arrayUpdatedResults[arrayUpdatedResults.length - 1];
  }

  res.send({ updated });
});

router.get('/lists', async (req, res) => {
  let gov, city;
  const { userID, hospitalID, bloodBankID } = req.query;
  if (userID) ({ gov, city } = await User.findById(userID));
  if (hospitalID) ({ gov, city } = await Hospital.findById(hospitalID));
  if (bloodBankID) ({ gov } = await BloodBank.findById(bloodBankID));
  const searchCriteria = bloodBankID ? { gov } : { gov, city };
  const hospitalList = await Hospital.find(searchCriteria);
  res.status(200).send(hospitalList);
});

module.exports = router;
