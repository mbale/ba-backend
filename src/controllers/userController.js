import User from '~/models/userModel.js';
import Review from '~/models/reviewModel.js';
import Sportsbook from '~/models/sportsbookModel.js';
import { ObjectId } from 'mongorito';
import _ from 'lodash';
import cloudinary from 'cloudinary';
import jwt from 'jsonwebtoken';

export default {
  async getInfo(request, reply) {
    let {
      userId,
    } = request.auth.credentials;
    userId = new ObjectId(userId);

    const db = request.server.app.db;
    db.register(User);

    try {
      const findUser = await User.findById(userId);

      // get fields
      const {
        _id: id,
        username,
        email,
        avatar,
        created_at: registeredOn,
      } = await findUser.get();

      // send back
      reply({
        id,
        username,
        email,
        avatar,
        registeredOn,
      });
    } catch (error) {
      reply.badImplementation(error);
    }
  },

  async getSteamInfo(request, reply) {
    let {
      userId,
    } = request.auth.credentials;
    userId = new ObjectId(userId);

    const db = request.server.app.db;
    db.register(User);

    try {
      const user = await User.findById(userId);

      if (user) {
        // get fields
        const {
          steamId,
          personaname: accountName,
          profileURL,
        } = await user.get('steamProvider');
        return reply({
          steamId,
          accountName,
          profileURL,
        });
      }
    } catch (error) {
      reply.badImplementation(error);
    }
    return reply.notFound('This account hasn\'t got attached STEAM profile');
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
    let {
      userId,
    } = request.auth.credentials;
    userId = new ObjectId(userId);

    const db = request.server.app.db;
    db.register(User);

    try {
      const user = await User.findById(userId);

      _.forEach(request.payload, (value, key) => {
        user.set(key, value);
      });

      await user.save();
      reply();
    } catch (error) {
      reply.badImplementation(error);
    }
  },

  async resetAccount(request, reply) {
    const email = request.payload.email;

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

  testRecoveryHash(request, reply) {
    const recoveryHash = request.headers.recoveryhash;

    const db = request.server.app.db;
    db.register(User);

    return User
      .findOne({
        recoveryHash,
      })
      .then((user) => {
        if (!user) {
          return reply.notFound();
        }
        return reply();
      });
  },

  recoverAccount(request, reply) {
    const {
      recoveryHash,
      password,
    } = request.payload;

    const db = request.server.app.db;
    db.register(User);

    const setPassword = (user) => {
      if (!user) {
        return Promise.reject({
          code: 0,
          data: recoveryHash,
        });
      }

      user.set('password', password);
      // reset recoveryhash as well
      user.set('recoveryHash', '');

      return user.save();
    };

    const successHandler = () => reply();

    const errorHandler = (error) => {
      switch (error.code) {
      case 0:
        reply.notFound();
        break;
      default:
        reply.badImplementation(error);
      }
    };

    return User
      .findOne({
        recoveryHash,
      })
      .then(setPassword)
      .then(successHandler)
      .catch(errorHandler);
  },

  changePassword(request, reply) {
    const userId = new ObjectId(request.auth.credentials.userId);
    const password = request.payload.password;

    const db = request.server.app.db;
    db.register(User);

    const updatePassword = (user) => {
      // set new pw
      user.set('password', password);
      // call model method to actually hash and save it
      return user.changePassword();
    };

    return User
      .findById(userId)
      .then(updatePassword)
      .then(() => reply());
  },
};
