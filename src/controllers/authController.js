import UserModel from '~/models/userModel.js';
import AccessTokenModel from '~/models/accessTokenModel.js';
import SocialProviderModel from '~/models/socialProviderModel.js';
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
    // token exp in unix timestamp
    reply({
      userId,
      iat,
      exp,
    });
  },

  revoke(request, reply) {
    const userId = request.auth.credentials.userId;

    AccessTokenModel
      .revokeToken(userId)
      .then(() => reply())
      .catch(error => reply.badImplementation(error));
  },

  basic(request, reply) {
    const {
      username,
      password,
    } = request.payload;

    const {
      jwt: jwtConfig,
    } = request.server.settings.app;

    const compareHash = (user) => {
      if (!user) {
        return Promise.reject({
          code: 0,
        });
      }

      return Promise.all([UserModel.comparePassword(password, user.get('password')), user]);
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

      const token = new AccessTokenModel({
        userId: user.get('_id'),
        rawToken,
      });

      return Promise.all([user, token.save()]);
    };

    const saveToken = ([user, token]) => {
      user.set('accessToken', token.get('_id'));

      return Promise.all([user.save(), token]);
    };

    return UserModel
      .findOne({
        username,
      })
      .then(compareHash)
      .then(checkIsMatch)
      .then(generateAndSaveToken)
      .then(saveToken)
      .then(([user, token]) => {
        reply({
          accessToken: token.get('rawToken'),
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
    const steamAPIKey = request.server.settings.app.steam.key;
    const isLoggedIn = request.auth.isAuthenticated;
    const auth = request.auth;

    const {
      steamId, // required
      username, // only when user submits otherwise generate
      password, // optional
      email, // optional
    } = request.payload;

    const steamUserAPIUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamAPIKey}&steamids=${steamId}`;

    // get user based on tokenid
    const authenticateUser = ({ data: { response: { players: steamData } } }) => {
      const promises = [steamData[0]];

      if (isLoggedIn) {
        // request user data when it's authenticated
        promises.push(UserModel.findById(auth.credentials.userId));
      } else {
        const userObj = {
          username: '',
          password,
          email,
        };

        const chance = new Chance();

        if (!username) {
          userObj.username = `${steamData[0].personaname}#${chance.natural()}`;
        }
        // signup new one
        const user = new UserModel(userObj);

        promises.push(user.save());
      }
      return Promise.all(promises);
    };

    const saveSocialProvider = ([steamData, user]) => {
      const socialProvider = new SocialProviderModel({
        userId: user.get('_id'),
        type: 'steam',
        data: steamData,
      });

      return Promise.all([socialProvider.save(), user]);
    };

    const saveOnUser = ([socialprovider, user]) => {
      const socialProviders = user.get('socialProviders');

      socialProviders.push(socialprovider.get('_id'));
      user.set('socialProviders', socialProviders);

      return user.save();
    };

    const generateToken = (user) => {
      return reply('user');
    };

    return axios
      .get(steamUserAPIUrl)
      .then(authenticateUser)
      .then(saveSocialProvider)
      .then(saveOnUser)
      .then(generateToken)
      .catch((er) => reply(er));
  },
};
