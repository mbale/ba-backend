import {
  Model,
  ActionTypes,
  ObjectId,
} from 'mongorito';
import bcrypt from 'bcrypt';
import EntityTakenError from '../errors/entity-taken-error.js';
import PasswordMismatchError from '../errors/password-mismatch-error.js';
import Templates from '../templates.js';
import server from '../index.js';
import Utils from '../utils.js';

class User extends Model {
  static collection() {
    return 'users';
  }
}

const hashPassword = () => ({ model }) => next => async (action) => {
  const { fields } = action;

  if (action.type === ActionTypes.CREATE && fields.password) {
    server.log(['info'], 'Hashing newly created user\'s password');
    const hashedPassword = await bcrypt.hash(fields.password, 10);

    fields.password = hashedPassword;
    model.set('password', hashedPassword);
  }
  return next(action);
};


const setDefaultFields = () => ({ model }) => next => async (action) => {
  const { fields } = action;

  if (action.type === ActionTypes.CREATE) {
    server.log(['info'], 'Setting newly created user\'s default fields');

    if (fields.username) {
      const username = fields.username.toLowerCase();
      const displayname = fields.displayname || fields.username;

      // we store username as lowercase and displayname as it was original as username
      fields.username = username;
      fields.displayname = displayname;
      model.set('username', username);
      model.set('displayname', displayname);
    }

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
      fields.steamProvider = false;
      model.set('steamProvider', false);
    }

    if (typeof fields.countryCode === 'undefined') {
      fields.countryCode = false;
      model.set('countryCode', false);
    }
  }
  return next(action);
};


const checkIfUserExists = () =>
  ({ modelClass }) => next => async (action) => {
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
        if (steamProvider.steamId && steamProvider.steamId !== '') {
          query.push({
            'steamProvider.steamId': steamProvider.steamId,
          });
        }

        const user = await modelClass.or(query).findOne();
        // check which field is not ok
        if (user) {
          // we have collision
          server.log(['info'], 'We already have such user');
          if (await user.get('email') === email) {
            throw new EntityTakenError('User', 'email', email);
          }

          if (await user.get('username') === username) {
            throw new EntityTakenError('User', 'username', username);
          }

          if (await user.get('steamProvider.steamId') === steamProvider.steamId) {
            throw new EntityTakenError('User', 'steamId', steamProvider.steamId);
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

const extendUserModel = (userModel) => {
  const UserModel = userModel;

  /*
    Get user profile with additionally private fields
  */
  UserModel.prototype.getProfile = async function getProfile(opts = {}) {
    try {
      const {
        privateProfile = false,
      } = opts;

      let profile = null;

      // get all props
      const {
        _id: id,
        username,
        // we default use username as lowercase (instead of migration)
        displayname = username,
        email,
        avatar: avatarPublicId,
        created_at: registeredOn,
        steamProvider,
        countryCode,
      } = await this.get();

      profile = {
        id,
        username: displayname,
        countryCode,
        registeredOn,
      };

      if (avatarPublicId) {
        profile.avatar = Utils.getCloudinaryURL(avatarPublicId);
      } else {
        profile.avatar = false;
      }

      // private profile
      if (privateProfile) {
        // assign private fields too
        Object.defineProperties(profile, {
          email: {
            value: email,
            enumerable: true,
          },
          steamProvider: {
            value: steamProvider,
            enumerable: true,
          },
          countryCode: {
            value: countryCode,
            enumerable: true,
          },
        });
      }

      return profile;
    } catch (error) {
      throw error;
    }
  };

  /*
    Edit an user profile
  */
  UserModel.prototype.editProfile = async function editProfile(propsInObjToEdit) {
    try {
      const user = this; // current user
      let userId = await user.get('_id'); // his id to exclude him when we search for collision
      userId = new ObjectId(userId);

      const propObj = propsInObjToEdit; // fields in profile to edit
      const query = []; // it contains all unique values he submitted and we search based on this
      let profileChanged = false; // indicate if we changed value

      // we set here unique values to check for collision
      const {
        email: emailToChange,
        username: usernameToChange,
      } = propsInObjToEdit;

      // we check for what unique value we need to search for
      if (usernameToChange) {
        query.push({
          username: usernameToChange.toLowerCase(),
        });
      }

      if (emailToChange) {
        query.push({
          email: emailToChange,
        });
      }

      // we check if we need to query for unique data
      if (query.length > 0) {
        const userWithCollision = await UserModel
          .where('_id')
          .ne(userId) // we explicitly take out logged user from results
          .or(query)
          .findOne();

        // so we have data collision
        if (userWithCollision) {
          const {
            username: usernameInDb,
            email: emailInDb,
          } = await userWithCollision.get();

          // check which field is same
          if (emailInDb === emailToChange) {
            throw new EntityTakenError('User', 'email', emailToChange);
          }

          if (usernameInDb === usernameToChange.toLowerCase()) {
            throw new EntityTakenError('User', 'username', usernameToChange);
          }

          // we throw error anyway to not let flow go through
          throw new EntityTakenError();
        }
      }

      // we iterate throuh without symbol (plain obj)
      for (const [prop, value] of Object.entries(propObj)) {
        const valueInDb = await user.get(prop);

        // we only set prop if it's really different
        if (valueInDb !== value) {
          if (prop !== 'username') {
            user.set(prop, value);
            profileChanged = true;
          } else {
            user.set('username', value.toLowerCase());
            user.set('displayname', value);
          }
        }
      }

      // if something changed then we save
      if (profileChanged) {
        await user.save();
      }

      return profileChanged;
    } catch (error) {
      throw error;
    }
  };

  /*
    Upload avatar to cloudinary from stream
   */
  UserModel.prototype.uploadAvatar = async function uploadAvatar(stream) {
    try {
      const {
        public_id: publicId,
      } = await Utils.streamToCloudinary(stream, {
        folder: 'avatars',
      });
      this.set('avatar', publicId);
      await this.save();
      return publicId;
    } catch (error) {
      throw error;
    }
  };

  /*
    Delete avatar from cloudinary and user profile as well
  */
  UserModel.prototype.deleteAvatar = async function deleteAvatar() {
    try {
      const avatarPublicId = await this.get('avatar');
      // first we delete from cloud
      await Utils.deleteContentFromCloudinary(avatarPublicId);
      // then from user
      this.set('avatar', false);
      await this.save();
    } catch (error) {
      throw error;
    }
  };

  /*
    Change user password
  */
  UserModel.prototype.changePassword = async function changePassword(password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      this.set('password', hashedPassword);

      await this.save();
    } catch (error) {
      throw error;
    }
  };

  /*
    Change user password
  */
  UserModel.prototype.revokeAccess = async function revokeAccess() {
    this.set('accessToken', false);
    await this.save();
  };

  /*
    Resetting and sending a hash to user in email to let him recover his account
  */
  UserModel.prototype.resetPassword = async function resetPassword() {
    try {
      server.log(['info'], 'Recovering account for user');

      const {
        _id: userId,
        email: userEmail,
        username,
      } = await this.get();

      // make recovery token
      const recoveryToken = Utils.encodeJWTToken({
        userId,
      });

      // setting prop
      this.set('recoveryToken', recoveryToken);
      // unset
      this.set('accessToken', false);

      // construct URL which we send user redirect to
      const actionURL = `${process.env.SITE_URL}/reset-password/${recoveryToken}`;
      const template = Templates.resetPassword(username, actionURL);

      const email = {
        from: process.env.EMAIL_FROM_RECOVER_ACCOUNT,
        to: userEmail,
        subject: process.env.EMAIL_SUBJECT_RECOVER_ACCOUNT,
        html: template,
      };

      await this.save();
      // emailing user
      await Utils.sendMail(email);
    } catch (error) {
      throw error;
    }
  };

  /*
    Authenticating user
  */
  UserModel.prototype.authorizeAccess = async function authorizeAccess(userIdToAttach) {
    try {
      server.log(['info'], 'Initiating authorization of user');

      const userId = await this.get('_id') || userIdToAttach;

      const accessToken = Utils.encodeJWTToken({
        userId,
      });

      const {
        iat: issuedAt,
        exp: expiresAt,
      } = Utils.decodeJWTToken(accessToken);

      // setting prop
      this.set('accessToken', {
        accessToken,
        issuedAt,
        expiresAt,
      });

      await this.save();

      return {
        accessToken,
        issuedAt,
        expiresAt,
      };
    } catch (error) {
      throw error;
    }
  };

  /*
    Compare a plain text password with current one
  */
  UserModel.prototype.comparePassword = async function comparePassword(passwordToCheck) {
    try {
      server.log(['info'], 'Comparing user\'s password');

      const {
        username,
        password,
      } = await this.get();

      // check if it equals
      const equals = await bcrypt.compare(passwordToCheck, password);

      if (!equals) {
        throw new PasswordMismatchError(username, password);
      }

      return equals;
    } catch (error) {
      throw error;
    }
  };

  /*
    Assign a review to a user
  */
  UserModel.prototype.addReviewById = async function addReviewById(reviewId) {
    try {
      server.log(['info'], 'Assign a bookmaker review to user');
      const reviews = await this.get('reviews');
      reviews.push(reviewId);
      this.set('reviews', reviews);

      await this.save();
    } catch (error) {
      throw error;
    }
  };
};

const injectPlugins = () => {
  // add neeeded dependencies
  User.use(extendUserModel);
  User.use(setDefaultFields);
  User.use(checkIfUserExists);
  User.use(hashPassword);

  return User;
};

export default injectPlugins();
