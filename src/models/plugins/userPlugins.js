import UsernameTakenError from '~/models/errors/usernameTakenError.js';
import EmailTakenError from '~/models/errors/emailTakenError.js';
import SteamIDTakenError from '~/models/errors/steamIDTakenError.js';
import User from '~/models/userModel.js';
import {
  ActionTypes,
} from 'mongorito';
import bcrypt from 'bcrypt';
import server from '~/index.js';

const hashPassword = () => {
  return ({ model }) => next => async (action) => {
    const { fields } = action;

    if (action.type === ActionTypes.CREATE) {
      if (fields.password !== '') {
        server.log(['info'], 'Hashing newly created user\'s password');
        const hashedPassword = await bcrypt.hash(fields.password, 10);

        fields.password = hashedPassword;
        model.set('password', hashedPassword);
      }
    }
    return next(action);
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
      fields.accessToken = '';
      fields.recoveryHash = '';
      fields.avatar = '';
      fields.reviews = [];
      /*
      modelset
       */
      model.set('accessToken', '');
      model.set('recoveryHash', '');
      model.set('avatar', '');
      model.set('reviews', []);
    }
    return next(action);
  };
};

const checkIfUserExists = () => {
  return ({ getState, dispatch, model, modelClass }) => next => async (action) => {
    if (action.type === ActionTypes.CREATE) {
      server.log(['info'], 'Check for possible duplications before adding new user');
      const {
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

        const user = await User.or(query).findOne();
        // check which field is not ok
        if (await user) {
          // we have collision
          server.log(['info'], 'We already have such user');
          if (await user.get('email') === email) {
            throw new EmailTakenError(email);
          }

          if (await user.get('username') === username) {
            throw new UsernameTakenError(username);
          }

          if (await user.get('steamProvider.steamid') === steamProvider.steamid) {
            throw new SteamIDTakenError(steamProvider.steamid);
          }
        }
      } catch (error) {
        // rethrow
        throw error;
      }
    }

    return next(action);
  };
};

const extendUser = (User) => {
  /*
    Cloudinary
   */
  User.prototype.setAvatar = (avatarURL) => {
    if (avatarURL !== '') {
      this.set('avatar', avatarURL);
    } else {
      throw new Error('Avatar URL\'s missing');
    }
  };

  User.prototype.changePassword = async (newPassword) => {
    if (newPassword !== '') {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      this.set('password', hashedPassword);
    } else {
      throw new Error('Password\'s missing');
    }
  };

  User.prototype.revokeAccess = async () => {

  };
};

export default {
  hashPassword,
  setDefaultFields,
  checkIfUserExists,
  extendUser,
};
