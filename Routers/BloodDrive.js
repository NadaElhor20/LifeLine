const express = require('express');
require('express-async-errors');
const _ = require('lodash');
const router = express.Router();
const BloodDrive = require('../Models/bloodDrive.js');
const { AuthorizedActor, AuthorizedBloodBank } = require('../middleware/authorization.js');
const { validateData } = require('../middleware/validateData');

router.get('/', AuthorizedActor, async (req, res) => {
  const bloodDriveList = await BloodDrive.find({}).populate([{ path: 'bloodBankID', select: ['name', 'addressDescription', 'phone'] }]);
  mappedBloodDrive = _.map(bloodDriveList, ({ bloodBankID, startDate, endDate, phone, description }) => ({
    startDate,
    endDate,
    phone,
    description,
    bloodBank: _.pick(bloodBankID, ['name', 'phone', 'addressDescription']),
  }));
  res.status(200).send(mappedBloodDrive);
});
router.post('/Add', AuthorizedBloodBank, validateData, async (req, res) => {
  const { startDate, endDate, phone, description, bloodBankID } = req.body;
  const bloodDrive = new BloodDrive({ startDate, endDate, phone, description, bloodBankID });
  const createdBloodDrive = await bloodDrive.save();

  res.status(200).send(createdBloodDrive);
});

module.exports = router;
