import User from '~/models/userModel.js';
import AccessToken from '~/models/accessTokenModel.js';
import {
  ObjectId,
} from 'mongorito';
import Chance from 'chance';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import Promise from 'bluebird';

export default {
  test(request, reply) {
    const {
      userId,
      iat,
      exp,
    } = request.auth.credentials;

    // token, user it's connected to
    // token issued at
    // token exp fin unix timestamp
    return reply({
      userId,
      iat,
      exp,
    });
  },

  revoke(request, reply) {
    const userId = request.auth.credentials.userId;
    const db = request.server.app.db;
    db.register(AccessToken);

    AccessToken
      .revokeToken(userId)
      .then(() => reply())
      .catch(error => reply.badImplementation(error));
  },

  basic(request, reply) {
    const {
      username,
      password,
    } = request.payload;

    const db = request.server.app.db;
    db.register(User);
    db.register(AccessToken);

    const {
      jwt: jwtConfig,
    } = request.server.settings.app;

    const compareHash = (user) => {
      if (!user) {
        return Promise.reject({
          code: 0,
        });
      }

      return Promise.all([User.comparePassword(password, user.get('password')), user]);
    };

    const checkIsMatch = ([ismatch, user]) => {
      if (!ismatch) {
        return Promise.reject({
          code: 1,
        });
      }
      return user;
    };

    const generateAndSaveToken = (user) => {
      const rawToken = jwt.sign({
        userId: user.get('_id'),
      }, jwtConfig.key, jwtConfig.options);

      const token = new AccessToken({
        userId: user.get('_id'),
        rawToken,
      });

      return token.save().then(() => rawToken);
    };

    return User
      .findOne({
        username,
      })
      .then(compareHash)
      .then(checkIsMatch)
      .then(generateAndSaveToken)
      .then((accessToken) => {
        reply({
          accessToken,
        });
      })
      .catch((error) => {
        switch (error.code) {
        case 0:
          reply.unauthorized();
          break;
        case 1:
          reply.unauthorized();
          break;
        default:
          reply.badImplementation(error);
        }
      });
  },

  steam(request, reply) {
    // steamapi access
    const steamAPIKey = request.server.settings.app.steam.key;
    // isLoggedIn === true & auth != null => authenticate user
    const isLoggedIn = request.auth.isAuthenticated;
    const auth = request.auth;
    // keysigning options
    const {
      jwt: jwtConfig,
    } = request.server.settings.app;

    const db = request.server.app.db;
    db.register(User);
    db.register(AccessToken);

    // for username generation
    const chance = new Chance();

    const {
      steamId, // required
      username, // only when user submits otherwise generate
      password, // optional
      email, // optional
    } = request.payload;

    const steamUserAPIUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamAPIKey}&steamids=${steamId}`;

    // check for user data in db
    const checkUser = (response) => {
      // requested steam data with steamid
      const steamData = response.data.response.players[0];
      const query = [{
        'steamProvider.steamid': steamData.steamid,
      }];

      // if it's authenticated then get user based on token information
      // refresh steamProvider data when it's already steamprovided
      if (isLoggedIn) {
        query.push({
          _id: new ObjectId(auth.credentials.userId),
        });
      }
      // find possible duplicate data
      return User
        .or(query)
        .findOne()
        .then((user) => {
          if (user) {
            user.set('steamProvider', steamData);
            return Promise.reject(user.save());
          }
          return steamData;
        });
    };

    // get user based on tokenid
    const addNewUser = (steamdata) => {
      // it's not submitted with token => signup user
      const userObj = {
        username: '',
        password,
        email,
        steamProvider: steamdata,
      };

      if (!username) {
        userObj.username = `${steamdata.personaname}#${chance.natural({
          max: 99999,
        })}`;
      }

      // creating new user
      const newUser = new User(userObj);

      return newUser.save();
    };

    // called from checkuser
    // we jump after addnewuser
    const alreadyInTheSystem = user => Promise.resolve(user);

    // generate and sign token with userid
    const generateToken = (user) => {
      const rawToken = jwt.sign({
        userId: user.get('_id'),
      }, jwtConfig.key, jwtConfig.options);

      const token = new AccessToken({
        userId: user.get('_id'),
        rawToken,
      });

      return token.save().then(() => rawToken);
    };

    // send out accesstoken
    const successHandler = accessToken => reply({
      accessToken,
    });

    const errorHandler = (error) => {
      switch (error.code) {
      default:
        return reply.badImplementation(error);
      }
    };

    return axios
      .get(steamUserAPIUrl)
      .then(checkUser)
      .then(addNewUser, alreadyInTheSystem)
      .then(generateToken)
      .then(successHandler)
      .catch(errorHandler);
  },
};
