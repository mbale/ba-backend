import validationErrors from '~/helpers/validationErrors.js';
import _ from 'lodash';

const {
  AUTH: AUTH_ERRORS,
  USER: USER_ERRORS,
  USERS: USERS_ERRORS,
  SPORTSBOOKS: SPORTSBOOKS_ERRORS,
} = validationErrors;

const structureErrorObject = (error) => {
  const output = error.output;
  // strip fields
  delete output.payload;
  delete output.headers;

  return output;
};

export default {
  auth: {
    basic(request, reply, source, error) {
      let errorObject = structureErrorObject(error);
      const errorDetails = error.data.details[0];

      switch (errorDetails.type) {
      case 'any.required':
        if (errorDetails.path === 'password') {
          errorObject = _.merge({}, errorObject, AUTH_ERRORS.BASIC.PASSWORD_REQUIRED);
        } else {
          errorObject = _.merge({}, errorObject, AUTH_ERRORS.BASIC.USERNAME_REQUIRED);
        }
        break;
      case 'any.empty':
        // check which one was empty
        errorObject = _.merge({}, errorObject, AUTH_ERRORS.BASIC.FIELD_EMPTY);
        errorObject.message = `${_.capitalize(errorDetails.path)}'s empty`;
        break;
      default:
        errorObject = _.merge({}, errorObject, AUTH_ERRORS.BASIC.UNDEFINED);
      }

      reply(errorObject).code(errorObject.statusCode);
    },
    steam(request, reply, source, error) {
      let errorObject = structureErrorObject(error);
      const errorDetails = error.data.details[0];

      switch (errorDetails.type) {
      case 'any.required':
        errorObject = _.merge({}, errorObject, AUTH_ERRORS.STEAM.STEAMID_REQUIRED);
        break;
      case 'string.length':
        errorObject = _.merge({}, errorObject, AUTH_ERRORS.STEAM.STEAMID_INVALID);
        break;
      case 'string.email':
        errorObject = _.merge({}, errorObject, AUTH_ERRORS.STEAM.EMAIL_INVALID);
        break;
      case 'string.min':
        errorObject = _.merge({}, errorObject, AUTH_ERRORS.STEAM.PASSWORD_TOO_SHORT);
        break;
      case 'any.empty':
        // check which one was empty
        errorObject = _.merge({}, errorObject, AUTH_ERRORS.STEAM.FIELD_EMPTY);
        errorObject.message = `${_.capitalize(errorDetails.path)}'s empty`;
        break;
      default:
        errorObject = _.merge({}, errorObject, AUTH_ERRORS.STEAM.UNDEFINED);
      }

      reply(errorObject).code(errorObject.statusCode);
    },
  },
  user: {
    editProfile(request, reply, source, error) {
      let errorObject = structureErrorObject(error);
      const errorDetails = error.data.details[0];

      switch (errorDetails.type) {
      case 'string.email':
        errorObject = _.merge({}, errorObject, USER_ERRORS.EDIT_PROFILE.EMAIL_INVALID);
        break;
      case 'object.min':
        errorObject = _.merge({}, errorObject, USER_ERRORS.EDIT_PROFILE.REQUEST_EMPTY);
        break;
      case 'any.empty':
        // check which one was empty
        errorObject = _.merge({}, errorObject, USER_ERRORS.EDIT_PROFILE.FIELD_EMPTY);
        errorObject.message = `${_.capitalize(errorDetails.path)}'s empty`;
        break;
      default:
        errorObject = _.merge({}, errorObject, USER_ERRORS.EDIT_PROFILE.UNDEFINED);
      }

      reply(errorObject).code(errorObject.statusCode);
    },
    resetAccount(request, reply, source, error) {
      let errorObject = structureErrorObject(error);
      const errorDetails = error.data.details[0];

      switch (errorDetails.type) {
      case 'string.email':
        errorObject = _.merge({}, errorObject, USER_ERRORS.RESET_ACCOUNT.EMAIL_INVALID);
        break;
      case 'any.required':
        errorObject = _.merge({}, errorObject, USER_ERRORS.RESET_ACCOUNT.EMAIL_REQUIRED);
        break;
      case 'any.empty':
        // check which one was empty
        errorObject = _.merge({}, errorObject, USER_ERRORS.RESET_ACCOUNT.FIELD_EMPTY);
        errorObject.message = `${_.capitalize(errorDetails.path)}'s empty`;
        break;
      default:
        errorObject = _.merge({}, errorObject, USER_ERRORS.RESET_ACCOUNT.UNDEFINED);
      }

      reply(errorObject).code(errorObject.statusCode);
    },
    testRecoveryToken(request, reply, source, error) {
      let errorObject = structureErrorObject(error);
      const errorDetails = error.data.details[0];

      switch (errorDetails.type) {
      case 'any.required':
        errorObject = _.merge({}, errorObject, USER_ERRORS.TEST_RECOVERYTOKEN.REQUIRED);
        break;
      default:
        errorObject = _.merge({}, errorObject, USER_ERRORS.TEST_RECOVERYTOKEN.UNDEFINED);
      }

      reply(errorObject).code(errorObject.statusCode);
    },
    recoverAccount(request, reply, source, error) {
      let errorObject = structureErrorObject(error);
      const errorDetails = error.data.details[0];

      switch (errorDetails.type) {
      case 'any.required':
        if (errorDetails.path === 'recoveryToken') {
          errorObject = _.merge({}, errorObject, USER_ERRORS.RECOVER_ACCOUNT.TOKEN_REQUIRED);
        } else {
          errorObject = _.merge({}, errorObject, USER_ERRORS.RECOVER_ACCOUNT.PASSWORD_REQUIRED);
        }
        break;
      case 'any.empty':
        // check which one was empty
        errorObject = _.merge({}, errorObject, USER_ERRORS.RECOVER_ACCOUNT.FIELD_EMPTY);
        errorObject.message = `${_.capitalize(errorDetails.path)}'s empty`;
        break;
      default:
        errorObject = _.merge({}, errorObject, USER_ERRORS.RECOVER_ACCOUNT.UNDEFINED);
      }

      reply(errorObject).code(errorObject.statusCode);
    },
    changePassword(request, reply, source, error) {
      let errorObject = structureErrorObject(error);
      const errorDetails = error.data.details[0];

      switch (errorDetails.type) {
      case 'any.required':
        if (errorDetails.path === 'oldPassword') {
          errorObject = _.merge({}, errorObject, USER_ERRORS.CHANGE_PASSWORD.OLD_PASSWORD_REQUIRED);
        } else {
          errorObject = _.merge({}, errorObject, USER_ERRORS.CHANGE_PASSWORD.NEW_PASSWORD_REQUIRED);
        }
        break;
      case 'string.min':
        if (errorDetails.path === 'oldPassword') {
          errorObject = _.merge({}, errorObject,
            USER_ERRORS.CHANGE_PASSWORD.OLD_PASSWORD_TOO_SHORT);
        } else {
          errorObject = _.merge({}, errorObject,
            USER_ERRORS.CHANGE_PASSWORD.NEW_PASSWORD_TOO_SHORT);
        }
        break;
      case 'object.min':
        errorObject = _.merge({}, errorObject, USER_ERRORS.CHANGE_PASSWORD.REQUEST_EMPTY);
        errorObject.message = `${_.capitalize(errorDetails.path)}'s empty`;
        break;
      default:
        errorObject = _.merge({}, errorObject, USER_ERRORS.CHANGE_PASSWORD.UNDEFINED);
      }

      reply(errorObject).code(errorObject.statusCode);
    },
  },
  users: {
    create(request, reply, source, error) {
      let errorObject = structureErrorObject(error);
      const errorDetails = error.data.details[0];

      switch (errorDetails.type) {
      case 'any.required':
        if (errorDetails.path === 'username') {
          errorObject = _.merge({}, errorObject, USERS_ERRORS.CREATE.USERNAME_REQUIRED);
        } else {
          errorObject = _.merge({}, errorObject, USERS_ERRORS.CREATE.PASSWORD_REQUIRED);
        }
        break;
      case 'string.min':
        errorObject = _.merge({}, errorObject, USERS_ERRORS.CREATE.PASSWORD_TOO_SHORT);
        break;
      case 'string.email':
        errorObject = _.merge({}, errorObject, USERS_ERRORS.CREATE.EMAIL_INVALID);
        break;
      case 'any.empty':
        errorObject = _.merge({}, errorObject, USERS_ERRORS.CREATE.FIELD_EMPTY);
        errorObject.message = `${_.capitalize(errorDetails.path)}'s empty`;
        break;
      default:
        errorObject = _.merge({}, errorObject, USERS_ERRORS.CREATE.UNDEFINED);
      }

      reply(errorObject).code(errorObject.statusCode);
    },
  },
  sportsbooks: {
    getAll(request, reply, source, error) {
      let errorObject = structureErrorObject(error);
      const errorDetails = error.data.details[0];

      switch (errorDetails.type) {
      case 'number.base':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.GETALL.LIMIT_NUMBER);
        break;
      case 'number.min':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.GETALL.LIMIT_MIN);
        break;
      case 'number.max':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.GETALL.LIMIT_MAX);
        break;
      default:
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.GETALL.UNDEFINED);
      }

      reply(errorObject).code(errorObject.statusCode);
    },
    create(request, reply, source, error) {
      let errorObject = structureErrorObject(error);
      const errorDetails = error.data.details[0];

      switch (errorDetails.type) {
      case 'any.required':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.CREATE.NAME_REQUIRED);
        break;
      case 'any.empty':
        // check which one was empty
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.CREATE.FIELD_EMPTY);
        errorObject.message = `${_.capitalize(errorDetails.path)}'s empty`;
        break;
      default:
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.CREATE.UNDEFINED);
      }

      reply(errorObject).code(errorObject.statusCode);
    },
    createReview(request, reply, source, error) {
      let errorObject = structureErrorObject(error);
      const errorDetails = error.data.details[0];
      console.log(errorDetails)

      switch (errorDetails.type) {
      case 'any.required':
        if (errorDetails.path === 'rate') {
          errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.CREATE_REVIEW.RATE_REQUIRED);
        } else {
          errorObject = _.merge({}, errorObject,
          SPORTSBOOKS_ERRORS.CREATE_REVIEW.SPORTSBOOKID_REQUIRED);
        }
        break;
      case 'string.regex.base':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.CREATE_REVIEW.OBJECTID_INVALID);
        break;
      case 'number.base':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.CREATE_REVIEW.RATE_NUMBER);
        break;
      case 'number.min':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.CREATE_REVIEW.RATE_MIN);
        break;
      case 'number.max':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.CREATE_REVIEW.RATE_MAX);
        break;
      case 'any.empty':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.CREATE_REVIEW.FIELD_EMPTY);
        errorObject.message = `${_.capitalize(errorDetails.path)}'s empty`;
        break;
      default:
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.CREATE_REVIEW.UNDEFINED);
      }

      reply(errorObject).code(errorObject.statusCode);
    },
    reviews(request, reply, source, error) {
      let errorObject = structureErrorObject(error);
      const errorDetails = error.data.details[0];

      switch (errorDetails.type) {
      case 'any.required':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.REVIEWS.SPORTSBOOKSID_REQUIRED);
        break;
      case 'string.regex.base':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.REVIEWS.SPORTSBOOKSID_INVALID);
        break;
      case 'number.min':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.REVIEWS.LIMIT_MIN);
        break;
      case 'number.max':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.REVIEWS.LIMIT_MAX);
        break;
      case 'number.base':
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.REVIEWS.LIMIT_NUMBER);
        break;
      default:
        errorObject = _.merge({}, errorObject, SPORTSBOOKS_ERRORS.REVIEWS.UNDEFINED);
      }

      reply(errorObject).code(errorObject.statusCode);
    }
  },
};
