import User from '~/models/userModel.js';
import Review from '~/models/reviewModel.js';
import Sportsbook from '~/models/sportsbookModel.js';
import { ObjectId } from 'mongorito';
import Nodemailer from 'nodemailer';
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

  // async getReviews(request, reply) {
  //   let {
  //     userId,
  //   } = request.auth.credentials;
  //   userId = new ObjectId(userId);

  //   const db = request.server.app.db;
  //   db.register(Review);

  //   try {
  //     const reviews = await Review
  //       .select({ });
  //       .find({
  //         userId,
  //       });
  //     const reviewsAsJSON =
  //   } catch (error) {

  //   }
  // },

  uploadAvatar(request, reply) {
    // init
    const payload = request.payload;
    const {
      userId: _id,
    } = request.auth.credentials;
    const userId = new ObjectId(_id);

    const db = request.server.app.db;
    db.register(User);

    // global
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadAvatar = new Promise((resolve, reject) => {
      const stream = cloudinary
        .uploader
        .upload_stream(resource => resolve(resource));

      // streaming directly to cloudinary
      payload.avatar.pipe(stream);

      // if error happens
      payload.avatar.on('end', (error) => {
        if (error) return reject(error);
      });
    });

    const updateAvatarOnUser = resource =>
      User
        .findById(userId)
        .then((user) => {
          user.set('avatar', resource.url);
          return user.save();
        });

    const successHandler = (r) => reply(r);

    const errorHandler = (error) => {
      switch (error.code) {
      default:
        reply.badImplementation(error);
      }
    };

    return uploadAvatar
      .then(updateAvatarOnUser)
      .then(successHandler)
      .catch(errorHandler);
  },

  deleteAvatar(request, reply) {
    const userId = new ObjectId(request.auth.credentials.userId);

    const db = request.server.app.db;
    db.register(User);

    return User
      .findById(userId)
      .then((user) => {
        user.set('avatar', '');
        //TODO Remove file?
        return user.save();
      });
  },

  editProfile(request, reply) {
    const userId = new ObjectId(request.auth.credentials.userId);

    const db = request.server.app.db;
    db.register(User);

    const updateFields = (user) => {
      _.forEach(request.payload, (value, key) => {
        user.set(key, value);
      });

      return user.save();
    };

    const successHandler = () => reply();

    const errorHandler = error => reply.badImplementation(error);

    return User
      .findById(userId)
      .then(updateFields)
      .then(successHandler)
      .catch(errorHandler);
  },

  resetAccount(request, reply) {
    const email = request.payload.email;

    const db = request.server.app.db;
    db.register(User);

    const {
      jwt: jwtConfig,
      email: emailConfig,
    } = request.server.settings.app;

    const generateToken = (user) => {
      if (!user) {
        return Promise.reject({
          code: 0,
          data: email,
        });
      }
      const recoveryToken = jwt.sign({
        userId: user.get('_id'),
      }, jwtConfig.key, jwtConfig.options);

      user.set('recoveryHash', recoveryToken);

      return user.save().then(() => [email, recoveryToken]);
    };

    const sendoutEmail = ([emailAddress, recoveryToken]) => {
      const transport = Nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_AUTH_USER,
          pass: process.env.EMAIL_AUTH_PASSWORD,
        },
      });

      const mailOptions = {
        from: '"Recover Account" <recover@esportsinsights.com>',
        to: emailAddress,
        subject: 'Here\'s your info to recover your acccount',
        text: `Here's your recover hash to reset your account: ${recoveryToken}`,
      };

      transport.sendMail(mailOptions, (error, info) => {
        if (error) {
          return Promise.reject({
            code: 1,
            data: error,
          });
        }
        request.server.log(['info', 'email'], info);
        return Promise.resolve();
      });
    };

    const successHandler = () => reply();

    const errorHandler = (error) => {
      switch (error.code) {
      case 0:
        reply.notFound(error.data);
        break;
      default:
        reply.badImplementation(error);
      }
    };

    return User
      .findOne({
        email,
      })
      .then(generateToken)
      .then(sendoutEmail)
      .then(successHandler)
      .catch(errorHandler);
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
