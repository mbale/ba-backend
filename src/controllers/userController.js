import { ObjectId } from 'mongorito';
import _ from 'lodash';
import cloudinary from 'cloudinary';
import jwt from 'jsonwebtoken';
import User from '~/models/userModel.js';
import PasswordMismatchError from '~/models/errors/passwordMismatchError.js';
import UsernameTakenError from '~/models/errors/usernameTakenError.js';
import EmailTakenError from '~/models/errors/emailTakenError.js';

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
        },
      } = request;

      let {
        auth: {
          credentials: {
            userId,
          },
        },
      } = request;

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
        const user = await User.or(query).findOne();

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

      // everything ok so we save new info
      const user = await User.findById(userId);
      // we iterate throuh without symbol (plain obj)
      for (const [field, value] of Object.entries(payload)) {
        user.set(field, value);
      }
      await user.save();
      return reply();
    } catch (error) {
      if (error instanceof UsernameTakenError) {
        return reply.conflict(error.message);
      }
      if (error instanceof EmailTakenError) {
        return reply.conflict(error.message);
      }
      return reply.badImplementation(error);
    }
  },

  async resetAccount(request, reply) {
    const {
      email,
    } = request.payload;

    const db = request.server.app.db;
    db.register(User);

    try {
      const user = await User.findOne({
        email,
      });

      if (user) {
        await user.recoverAccount();
        reply();
      } else {
        reply.notFound('We do not have an account associated with this email address.');
      }
    } catch (error) {
      reply.badImplementation(error);
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

  async recoverAccount(request, reply) {
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
