import { ObjectId } from 'mongorito';
import cloudinary from 'cloudinary';
import jwt from 'jsonwebtoken';
import countryList from 'country-list';
import User from '~/models/userModel.js';
import InvalidCountryCodeError from '~/models/errors/invalidCountryCodeError';
import PasswordMismatchError from '~/models/errors/passwordMismatchError.js';
import UsernameTakenError from '~/models/errors/usernameTakenError.js';
import EmailTakenError from '~/models/errors/emailTakenError.js';

const countries = countryList();

export default {
  async getInfo(request, reply) {
    let {
      userId,
    } = request.auth.credentials;
    userId = new ObjectId(userId);

    const db = request.server.app.db;
    db.register(User);

    try {
      const user = await User.findById(userId);

      // get fields
      const {
        _id: id,
        username,
        email,
        avatar,
        created_at: registeredOn,
        steamProvider,
      } = await user.get();

      const replyObj = {
        id,
        username,
        email,
        avatar,
        registeredOn,
      };

      // check if steamprovider is set up
      if (Object.keys(steamProvider).length > 0) {
        replyObj.steamProvider = steamProvider;
      }

      // send back
      return reply(replyObj);
    } catch (error) {
      return reply.badImplementation(error);
    }
  },

  async uploadAvatar(request, reply) {
    // init
    const payload = request.payload;
    let {
      userId,
    } = request.auth.credentials;
    userId = new ObjectId(userId);

    const db = request.server.app.db;
    db.register(User);

    // global
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const user = await User.findById(userId);

    // streaming directly to cloudinary
    function uploadAvatar(fromStream) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(resource => resolve(resource));
        fromStream.pipe(stream);
        fromStream.on('error', error => reject(error));
      });
    }

    try {
      const {
        secure_url: secureURL,
      } = await uploadAvatar(payload.avatar);

      await user.setAvatar(secureURL);
      reply();
    } catch (error) {
      reply.badImplementation(error);
    }
  },

  async deleteAvatar(request, reply) {
    let {
      userId,
    } = request.auth.credentials;
    userId = new ObjectId(userId);

    const db = request.server.app.db;
    db.register(User);

    try {
      const user = await User.findById(userId);
      await user.setAvatar();

      reply();
    } catch (error) {
      reply.badImplementation(error);
    }
  },

  async editProfile(request, reply) {
    try {
      const {
        server: {
          app: {
            db,
          },
        },
        payload, payload: {
          username = '',
          email = '',
          countryCode,
        },
      } = request;

      let {
        auth: {
          credentials: {
            userId,
          },
        },
      } = request;

      // validate country code
      if (!countries.getName(countryCode)) {
        throw new InvalidCountryCodeError(countryCode);
      }

      userId = new ObjectId(userId);
      db.register(User);

      const query = [];

      if (username !== '') {
        query.push({
          username,
        });
      }

      if (email !== '') {
        query.push({
          email,
        });
      }

      // check for duplication
      if (query.length > 0) {
        const user = await User
          .where('_id').ne(userId) // we explicitly forbid logged userid
          .or(query).findOne();

        // we match
        if (user) {
          const {
            username: usernameInDb,
            email: emailInDb,
          } = await user.get();

          /*
            Check why we have collision
            we make sure we allow edits if user's trying to edit his data
           */
          if (emailInDb === email) {
            throw new EmailTakenError(email);
          }

          if (usernameInDb === username) {
            throw new UsernameTakenError(username);
          }
        }
      }

      // everything ok so we save new info
      const user = await User.findById(userId);

      let profileChanged = false;
      // we iterate throuh without symbol (plain obj)
      for (let [field, value] of Object.entries(payload)) { // eslint-disable-line
        const valueInDb = await user.get(field); // eslint-disable-line

        // we only set prop if it's really changed
        if (valueInDb !== value) {
          user.set(field, value);
          profileChanged = true;
        }
      }

      if (profileChanged) {
        await user.save();
      }
      return reply();
    } catch (error) {
      if (error instanceof UsernameTakenError) {
        return reply.conflict(error.message);
      } else if (error instanceof EmailTakenError) {
        return reply.conflict(error.message);
      } else if (error instanceof InvalidCountryCodeError) {
        return reply.badData(error.message);
      }
      return reply.badImplementation(error);
    }
  },

  async forgotPassword(request, reply) {
    const {
      email,
    } = request.payload;

    const db = request.server.app.db;
    db.register(User);

    try {
      const user = await User.findOne({
        email,
      });

      if (!user) {
        return reply.notFound('We do not have an account associated with this email address.');
      }

      await user.recoverAccount();
      return reply();
    } catch (error) {
      return reply.badImplementation(error);
    }
  },

  async testRecoveryToken(request, reply) {
    const {
      'recovery-token': recoveryToken,
    } = request.headers;

    const db = request.server.app.db;
    db.register(User);

    const user = await User.findOne({
      recoveryToken,
    });

    if (!user) {
      return reply.notFound('Invalid recovery token');
    }

    // decode
    const {
      payload: {
        iat: issuedAt,
        exp: expiresAt,
      },
    } = jwt.decode(recoveryToken, { complete: true });

    return reply({
      issuedAt,
      expiresAt,
    });
  },

  async resetPassword(request, reply) {
    const {
      recoveryToken,
      password,
    } = request.payload;

    const db = request.server.app.db;
    db.register(User);

    const user = await User.findOne({
      recoveryToken,
    });

    if (!user) {
      return reply.notFound('Invalid recovery token');
    }

    await user.changePassword(password);
    user.set('recoveryToken', false);
    await user.save();
    return reply();
  },

  async changePassword(request, reply) {
    try {
      let {
        userId,
      } = request.auth.credentials;
      userId = new ObjectId(userId);

      const {
        oldPassword,
        newPassword,
      } = request.payload;

      const db = request.server.app.db;
      db.register(User);

      const user = await User.findById(userId);
      // we first check if submitted old password is ok within db
      // otherwise it's throwing error
      await user.comparePassword(oldPassword);
      // ok we change
      await user.changePassword(newPassword);

      return reply();
    } catch (error) {
      if (error instanceof PasswordMismatchError) {
        return reply.unauthorized(error.message);
      }
      return reply.badImplementation(error);
    }
  },
};
