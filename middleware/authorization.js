const customError = require('../Helper/ErrorHandler.js');
const User = require('../Models/user.js');
const Hospital = require('../Models/hospital.js');
const BloodBank = require('../Models/bloodBank');

const createAuthorizationMiddleware = (actorModel) => {
  return async (req, res, next) => {
    let model = actorModel;
    const { userID, hospitalID, bloodBankID } = req.query;
    const authentication = req.headers.authentication;
    if (!model) {
      model = userID ? User : hospitalID ? Hospital : bloodBankID ? BloodBank : null;
    }
    try {
      if (!authentication) {
        throw new customError('not authorized', 401);
      }

      if (!model) {
        throw new customError('invalid actor type or parameters', 400);
      }

      const entity = await model.getEntityFromToken(authentication);
      if (!entity) {
        throw new customError('not authorized', 401);
      }

      next();
    } catch (error) {
      if (error.name == 'JsonWebTokenError') {
        next(new customError('invalid token, sign in again', 498));
      } else {
        next(error);
      }
    }
  };
};

const AuthorizedActor = createAuthorizationMiddleware(null); // Placeholder for actor model
const AuthorizedUser = createAuthorizationMiddleware(User);
const AuthorizedHospital = createAuthorizationMiddleware(Hospital);
const AuthorizedBloodBank = createAuthorizationMiddleware(BloodBank);

module.exports = { AuthorizedActor, AuthorizedUser, AuthorizedHospital, AuthorizedBloodBank };
