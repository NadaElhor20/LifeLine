const express = require('express');
require('express-async-errors');
const _ = require('lodash');
const router = express.Router();
const User = require('../Models/user');
const { validateRegisteredUser, validateUpdatedUser, calculateAge } = require('../Controllers/users');
const { AuthorizedUser,AuthorizedActor } = require('../middleware/authorization');
const customError = require('../Helper/ErrorHandler.js');

router.post('/', validateRegisteredUser, async (req, res) => {
  const { firstName, lastName, email, password, birthDate, gender, phone, bloodType, disease, gov, city, receivedHistory, donationTimes, lastDonationDate } = req.body;
  // const userAge = calculateAge(birthDate);
  const user = new User({ firstName, lastName, email, password, birthDate, gender, phone, bloodType, disease, donationTimes, gov, city, receivedHistory, lastDonationDate });
  const createdUser = await user.save();
  res.status(200).send(createdUser);
});

router.post('/signIn', async (req, res) => {
  const { email, password } = req.body;
  let userID;
  const user = await User.findOne({ email });
  console.log(userID, 'userID');
  if (!user) throw new customError('invalid email or password', 401);
  const match = await user.checkPassword(password);
  if (!match) throw new customError('invalid email or password', 401);
  const token = await user.generateToken();
  if (user) {
    userID = user._id;
  }
  console.info('user login successfully');
  res.status(200).send({ token, userID });
});

router.get('/profile', AuthorizedUser, async (req, res) => {
  const authentication = req.headers.authentication;
  const user = await User.getEntityFromToken(authentication);
  res.status(200).send({ user });
});

router.patch('/:id', validateUpdatedUser, AuthorizedUser, async (req, res) => {
  const { id } = req.params;
  const allowedAttributes = ['firstName', 'lastName', 'password', 'birthDate', 'gender', 'phone', 'bloodType', 'disease', 'gov', 'city', 'receivedHistory', 'donationTimes', 'lastDonationDate'];
  const editedValues = {};
  const arrayUpdates = [];
  let updated;
  const { disease } = await User.findById(id, { disease: 1 });

  // Separate array and non-array attributes
  Object.entries(req.body).forEach(([key, value]) => {
    if (allowedAttributes.includes(key)) {
      if (key !== 'disease' && key !== 'receivedHistory') {
        editedValues[key] = value;
      } else {
        let modifiedValue = value;
        if (key === 'disease') {
          modifiedValue = Array.isArray(value) ? value : [value];
          const uniqueDiseases = _.difference(_.uniq(modifiedValue), disease);
          arrayUpdates.push(User.findByIdAndUpdate(id, { $addToSet: { [key]: { $each: uniqueDiseases } } }, { new: true, runValidators: true }));
        } else {
          arrayUpdates.push(User.findByIdAndUpdate(id, { $push: { [key]: modifiedValue } }, { new: true, runValidators: true }));
        }
      }
    }
  });

  // Update non-array attributes
  if (Object.keys(editedValues).length > 0) {
    updated = await User.findByIdAndUpdate(id, { $set: editedValues }, { new: true, runValidators: true });
  }

  // Wait for all array updates to complete
  if (arrayUpdates.length > 0) {
    const arrayUpdatedResults = await Promise.all(arrayUpdates);
    updated = arrayUpdatedResults[arrayUpdatedResults.length - 1];
  }

  res.send({ updated });
});

router.get('/Heros', AuthorizedActor, async (req, res) => {
  const { filter } = req.query;
  let query = {};

  if (filter) {
    const { startDate, endDate } = JSON.parse(filter.replace(/'/g, '"'));
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;
    if (startDateObj && endDateObj) {
      query = { lastDonationDate: { $gte: startDateObj, $lt: endDateObj } };
    }
  }

  const heros = await User.find(query).sort({ donationTimes: -1 });

  const mappedHeros = heros.map((hero, idx) => ({
    fullName: `${hero.firstName} ${hero.lastName}`,
    rank: idx + 1,
    phone: hero.phone,
    donationTimes: hero.donationTimes,
  }));

  res.status(200).send(mappedHeros);
 
});

module.exports = router;
