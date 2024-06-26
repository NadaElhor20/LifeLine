const express = require('express');
require('express-async-errors');
const _ = require('lodash');
const router = express.Router();
const User = require('../Models/user.js');
const Hospital = require('../Models/hospital.js');
const BloodBank = require('../Models/bloodBank.js');
const Order = require('../Models/order.js');
const { AuthorizedActor } = require('../middleware/authorization.js');
const { validateData } = require('../middleware/validateData');
const customError = require('../Helper/ErrorHandler.js');

router.post('/Add', AuthorizedActor, validateData, async (req, res) => {
  let newOrder;
  const { bloodGroup, bloodBankID, hospitalID, from, to } = req.body;
  const bloodGroupData = to === 'hospital' ? await Hospital.findById(hospitalID, { bloodGroup: 1 }) : await BloodBank.findById(bloodBankID, { bloodGroup: 1 });

  if (bloodGroupData) {
    const allowedOnStock = _.intersectionBy(bloodGroupData.bloodGroup, bloodGroup, 'bloodType');
    const anyAmountLess = _.some(bloodGroup, (blood) => {
      const allowedBlood = allowedOnStock.find((allowedBlood) => allowedBlood.bloodType === blood.bloodType);
      return allowedBlood && allowedBlood.count < blood.count;
    });

    if (anyAmountLess) {
      throw new customError('Stock insufficient', 404);
    } else {
      const order = new Order({ bloodGroup, bloodBankID, hospitalID, from, to, status: 'pending' });
      newOrder = await order.save();
    }
  }
  res.status(200).send(newOrder);
});
router.patch('/changeStatus', AuthorizedActor, async (req, res) => {
  const { orderID, bloodBankID, hospitalID } = req.query;
  const { status } = req.body;

  const order = await Order.findById(orderID).populate('hospitalID bloodBankID', 'bloodGroup');
  if (order.status !== 'pending') throw new customError('Order already settled', 403);

  if (!order) {
    throw new customError('Order not found', 404);
  }
  if (status === 'reject') {
    await Order.findByIdAndUpdate(orderID, { $set: { status } }, { new: true });
  } else {
    const { bloodGroup: orderBloodGroup, hospitalID: orderHospitalID, bloodBankID: orderBloodBankID } = order;
    const isHospitalOrder = hospitalID && order.to === 'hospital';
    const isBloodBankOrder = bloodBankID && order.to === 'bank';

    if (!isHospitalOrder && !isBloodBankOrder) {
      throw new customError('Unauthorized to change order status', 403);
    }

    const { bloodGroup: hospitalBloodGroup } = order.hospitalID;
    const { bloodGroup: bloodBankBloodGroup } = order.bloodBankID;
    let updatedHospitalBloodGroup, updatedBloodBankBloodGroup;

    if (isHospitalOrder) {
      const insufficientStock = orderBloodGroup.some((blood) => {
        const hospitalStock = hospitalBloodGroup.find((stock) => stock.bloodType === blood.bloodType);
        return hospitalStock && hospitalStock.count < blood.count;
      });

      if (insufficientStock) {
        throw new customError('Stock insufficient', 404);
      }

      updatedHospitalBloodGroup = hospitalBloodGroup.map((stock) => {
        const orderBlood = orderBloodGroup.find((blood) => blood.bloodType === stock.bloodType);
        if (orderBlood) {
          stock.count -= orderBlood.count;
        }
        return stock;
      });

      updatedBloodBankBloodGroup = bloodBankBloodGroup.map((stock) => {
        const orderBlood = orderBloodGroup.find((blood) => blood.bloodType === stock.bloodType);
        if (orderBlood) {
          stock.count += orderBlood.count;
        }
        return stock;
      });
    } else if (isBloodBankOrder) {
      const insufficientStock = orderBloodGroup.some((blood) => {
        const bloodBankStock = bloodBankBloodGroup.find((stock) => stock.bloodType === blood.bloodType);
        return bloodBankStock && bloodBankStock.count < blood.count;
      });

      if (insufficientStock) {
        throw new customError('Stock insufficient', 404);
      }

      updatedBloodBankBloodGroup = bloodBankBloodGroup.map((stock) => {
        const orderBlood = orderBloodGroup.find((blood) => blood.bloodType === stock.bloodType);
        if (orderBlood) {
          stock.count -= orderBlood.count;
        }
        return stock;
      });

      updatedHospitalBloodGroup = hospitalBloodGroup.map((stock) => {
        const orderBlood = orderBloodGroup.find((blood) => blood.bloodType === stock.bloodType);
        if (orderBlood) {
          stock.count += orderBlood.count;
        }
        return stock;
      });
    }

    await Promise.all([
      Hospital.findByIdAndUpdate(orderHospitalID, { $set: { bloodGroup: updatedHospitalBloodGroup } }),
      BloodBank.findByIdAndUpdate(orderBloodBankID, { $set: { bloodGroup: updatedBloodBankBloodGroup } }),
      Order.findByIdAndUpdate(orderID, { $set: { status } }, { new: true }),
    ]);
  }
  res.status(200).send('Order status updated successfully');
});
router.get('/ordersList', AuthorizedActor, async (req, res) => {
  const { hospitalID, bloodBankID } = req.query;
  const query = hospitalID ? { hospitalID } : { bloodBankID };
  const orders = await Order.find(query).populate([
    { path: 'hospitalID', select: ['name', 'addressDescription', 'phone'] },
    { path: 'bloodBankID', select: ['name', 'addressDescription', 'phone'] },
  ]);
  mappedOrders = _.map(orders, ({ createdAt, bloodBankID, hospitalID, from, to, status, _id: orderID }) => ({
    orderID,
    createdAt,
    from,
    to,
    status,
    hospital: _.pick(hospitalID, ['name', 'phone', 'addressDescription']),
    bloodBank: _.pick(bloodBankID, ['name', 'phone', 'addressDescription']),
  }));

  res.status(200).send(mappedOrders);
});
router.get('/', AuthorizedActor, async (req, res) => {
  const { orderID } = req.query;

  const orders = await Order.findById(orderID).populate([
    { path: 'hospitalID', select: ['name', 'addressDescription', 'phone'] },
    { path: 'bloodBankID', select: ['name', 'addressDescription', 'phone'] },
  ]);
  mappedOrders = _.map(orders, ({ createdAt, bloodBankID, hospitalID, from, to, status, _id: orderID }) => ({
    orderID,
    createdAt,
    from,
    to,
    status,
    hospital: _.pick(hospitalID, ['name', 'phone', 'addressDescription']),
    bloodBank: _.pick(bloodBankID, ['name', 'phone', 'addressDescription']),
  })).filter((order) => !_.isEmpty(order.hospital) && !_.isEmpty(order.bloodBank));

  res.status(200).send(mappedOrders[0]);
});

module.exports = router;
