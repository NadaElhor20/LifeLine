const express = require('express');
require('express-async-errors');
const _ = require('lodash');
const router = express.Router();
const ArgentCall = require('../Models/argentCall.js');
const { AuthorizedActor, AuthorizedHospital } = require('../middleware/authorization.js');
const { validateData } = require('../middleware/validateData.js');
const customError = require('../Helper/ErrorHandler.js');

router.get('/', AuthorizedActor, async (req, res) => {
  const argentCallList = await ArgentCall.find({}).populate([{ path: 'hospitalID', select: ['name', 'addressDescription', 'phone'] }]);
  mappedArgentCall = _.map(argentCallList, ({ _id:ArgentCallID,hospitalID, gov, city, description, createDate, bloodGroup }) => ({
    gov,
    city,
    description,
    createDate,
    bloodGroup,
    ArgentCallID,
    hospital: _.pick(hospitalID, ['name', 'phone', 'addressDescription']),
  }));
  res.status(200).send(mappedArgentCall);
});
router.post('/Add', AuthorizedHospital, validateData, async (req, res) => {
  const { hospitalID, gov, city, description, createDate, bloodGroup } = req.body;
  const argentCall = new ArgentCall({ hospitalID, gov, city, description, createDate, bloodGroup });
  const createdArgentCall = await argentCall.save();
  res.status(200).send(createdArgentCall);
});

router.delete('/:id', AuthorizedHospital, async (req, res) => {
  const { id } = req.params;
  const deleted = await ArgentCall.findByIdAndDelete(id);
if(!deleted ) throw new customError('There is no matched argent call record', 404)
  res.status(200).send('delete Successfully');
});

module.exports = router;
