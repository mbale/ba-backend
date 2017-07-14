import UsernameNotFoundError from '~/models/errors/usernameNotFoundError.js';
import UsernameTakenError from '~/models/errors/usernameTakenError.js';
import EmailTakenError from '~/models/errors/emailTakenError.js';
import SteamIdTakenError from '~/models/errors/steamIdTakenError.js';
import UserBySteamIdNotFoundError from '~/models/errors/userBySteamIdNotFoundError.js';
import PasswordMismatchError from '~/models/errors/passwordMismatchError.js';
import forgetPasswordTemplate from '~/helpers/email/forgetPasswordTemplate.js';
import emailService from '~/services/emailService.js';
import server from '~/index.js';
import {
  ActionTypes,
} from 'mongorito';
import Nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const hashPassword = () => {
  return ({ model }) => next => async (action) => {
    const { fields } = action;

    if (action.type === ActionTypes.CREATE) {
      if (fields.password) {
        server.log(['info'], 'Hashing newly created user\'s password');
        const hashedPassword = await bcrypt.hash(fields.password, 10);

        fields.password = hashedPassword;
        model.set('password', hashedPassword);
      }
    }
    return next(action);
  };
};

const checkUniqueFieldsOnEdit = () => {
  return ({ modelClass }) => next => async (action) => {
    try {
      const {
        type,
      } = action;
      // TODO: differentiate between changing password and making a profile update
      if (type === ActionTypes.SET) {
        const {
          fields: {
            username = '',
            email = '',
          },
        } = action;

        server.log(['info'], 'Checking for possible duplication during user profile edit');

        const query = [];

        // we're changing username
        if (username && username !== '') {
          query.push({
            username,
          });
        }

        // -- email
        if (email && email !== '') {
          query.push({
            email,
          });
        }

        if (query.length > 0) {
          const user = await modelClass.or(query).findOne();

          // we match
          if (user) {
            const {
              username: usernameInDb,
              email: emailInDb,
            } = await user.get();

            // check why we have collision
            if (emailInDb === email) {
              throw new EmailTakenError(email);
            }

            if (usernameInDb === username) {
              throw new UsernameTakenError(username);
            }
          }
        }
      }
      return next(action);
    } catch (error) {
      throw error;
    }
  };
};

const setDefaultFields = () => {
  return ({ model }) => next => async (action) => {
    const { fields } = action;

    if (action.type === ActionTypes.CREATE) {
      server.log(['info'], 'Setting newly created user\'s default fields');

      /*
      fieldset
       */
      if (typeof fields.accessToken === 'undefined') {
        fields.accessToken = false;
        model.set('accessToken', false);
      }

      if (typeof fields.recoveryToken === 'undefined') {
        fields.recoveryToken = false;
        model.set('recoveryToken', false);
      }

      if (typeof fields.avatar === 'undefined') {
        fields.avatar = false;
        model.set('avatar', false);
      }

      if (typeof fields.reviews === 'undefined') {
        fields.reviews = [];
        model.set('reviews', []);
      }

      if (typeof fields.steamProvider === 'undefined') {
        fields.steamProvider = {};
        model.set('steamProvider', {});
      }

      if (typeof fields.countryCode === 'undefined') {
        fields.countryCode = '';
        model.set('countryCode', '');
      }
    }
    return next(action);
  };
};

const checkIfUserExists = () => {
  return ({ getState, dispatch, model, modelClass }) => next => async (action) => {
    if (action.type === ActionTypes.CREATE) {
      server.log(['info'], 'Check for possible duplications before adding new user');
      const {
        // refactor TODO: it could be better without default value
        fields: { email = '', username = '', steamProvider = '' },
      } = action;

      try {
        // build query based on which data he submitted
        const query = [];

        // if he submitted email with signup
        if (email && email !== '') {
          query.push({
            email,
          });
        }

        // if he submitted username too
        if (username && username !== '') {
          query.push({
            username,
          });
        }

        // and check for steamid, too
        if (steamProvider.steamid && steamProvider.steamid !== '') {
          query.push({
            'steamProvider.steamid': steamProvider.steamid,
          });
        }

        const user = await modelClass.or(query).findOne();
        // check which field is not ok
        if (user) {
          // we have collision
          server.log(['info'], 'We already have such user');
          if (await user.get('email') === email) {
            throw new EmailTakenError(email);
          }

          if (await user.get('username') === username) {
            throw new UsernameTakenError(username);
          }

          if (await user.get('steamProvider.steamid') === steamProvider.steamid) {
            throw new SteamIdTakenError(steamProvider.steamid);
          }
          throw new Error('Duplicate user');
        }
      } catch (error) {
        // rethrow
        throw error;
      }
    }

    return next(action);
  };
};

const extendUserModel = (UserModel) => {
  const userModel = UserModel;

  /*
    Utils
   */
  userModel.findByUsername = async function findByUsername(username) {
    try {
      if (username !== '') {
        const user = await userModel.findOne({
          username,
        });
        if (!user) {
          throw new UsernameNotFoundError(username);
        }
        return user;
      }
      throw new Error('Username\'s missing');
    } catch (error) {
      throw error;
    }
  };

  userModel.findUserBySteamId = async function findUserBySteamId(steamId) {
    try {
      if (steamId !== '') {
        const user = await userModel.findOne({
          'steamProvider.steamId': steamId,
        });
        if (!user) {
          throw new UserBySteamIdNotFoundError(steamId);
        }
        return user;
      }
      throw new Error('SteamId\'s missing');
    } catch (error) {
      throw error;
    }
  };

  /*
    Cloudinary
   */
  userModel.prototype.setAvatar = async function setAvatar(avatarURL = false) {
    this.set('avatar', avatarURL);
    await this.save();
  };

  /*
    Auth
   */
  userModel.prototype.changePassword = async function changePassword(newPassword = '') {
    if (newPassword !== '') {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      this.set('password', hashedPassword);
      await this.save();
    } else {
      throw new Error('Password\'s missing');
    }
  };

  userModel.prototype.revokeAccess = async function revokeAccess() {
    this.set('accessToken', false);
    await this.save();
  };

  userModel.prototype.recoverAccount = async function recoverAccount() {
    const {
      _id: userId,
      email: userEmail,
      username,
    } = await this.get();

    try {
      server.log(['info'], 'Recovering account');
      // make recovery token
      const recoveryToken = jwt.sign({
        userId,
      }, process.env.JWT_KEY, {
        expiresIn: process.env.JWT_DURATION,
      });

      // setting prop
      this.set('recoveryToken', recoveryToken);
      // unset
      this.set('accessToken', false);

      // construct URL which we send user redirect to
      const actionURL = `${process.env.SITE_URL}/reset-password/${recoveryToken}`;
      const template = forgetPasswordTemplate(username, actionURL);

      const email = {
        from: process.env.EMAIL_FROM_RECOVER_ACCOUNT,
        to: userEmail,
        subject: process.env.EMAIL_SUBJECT_RECOVER_ACCOUNT,
        html: template,
      };

      await this.save();
      // emailing user
      await emailService(email);
    } catch (error) {
      throw error;
    }
  };

  userModel.prototype.authorizeAccess = async function authorizeAccess(userIdToAttach) {
    server.log(['info'], 'Initiating authorization of user');
    try {
      const userId = await this.get('_id') || userIdToAttach;

      const rawToken = jwt.sign({
        userId,
      }, process.env.JWT_KEY, {
        expiresIn: process.env.JWT_DURATION,
      });
      const {
        payload: {
          iat: issuedAt,
          exp: expiresAt,
        },
      } = jwt.decode(rawToken, { complete: true });

      // setting prop
      this.set('accessToken', {
        rawToken,
        issuedAt,
        expiresAt,
      });
      await this.save();
      return {
        rawToken,
        issuedAt,
        expiresAt,
      };
    } catch (error) {
      throw error;
    }
  };

  userModel.prototype.comparePassword = async function comparePassword(passwordToCheck) {
    try {
      server.log(['info'], 'Comparing user\'s password');
      if (passwordToCheck !== '') {
        const hashedPassword = await this.get('password');
        const username = await this.get('username');

        // check if it equals
        const equals = await bcrypt.compare(passwordToCheck, hashedPassword);
        if (!equals) {
          throw new PasswordMismatchError(username, passwordToCheck);
        }
        return equals;
      }
      throw new Error('Can\'t compare without another password');
    } catch (error) {
      throw error;
    }
  };

  userModel.prototype.addReviewById = async function addReviewById(reviewId) {
    try {
      if (reviewId !== '') {
        server.log(['info'], 'Adding a review for sportsbook to user');
        const reviews = await this.get('reviews');
        reviews.push(reviewId);
        this.set('reviews', reviews);

        await this.save();
      }
    } catch (error) {
      throw error;
    }
  };
};

export default {
  hashPassword,
  setDefaultFields,
  //checkUniqueFieldsOnEdit,
  checkIfUserExists,
  extendUserModel,
};
