import UserModel from '~/models/userModel.js';
import AccessTokenModel from '~/models/accessTokenModel.js';
import jwt from 'jsonwebtoken';
import Promise from 'bluebird';

export default {
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

      return Promise
        .all([UserModel.comparePassword(password, user.get('password')), user]);
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
      .catch(error => reply.badImplementation(error));
  },
};
