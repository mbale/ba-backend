import UserModel from '~/models/userModel.js';
import AccessTokenModel from '~/models/accessTokenModel.js';

export default {
  basic(request, reply) {
    const {
      username,
      password,
    } = request.payload;

    return UserModel
      .find({
        username,
      })
      .then(UserModel.hashPassword('s'))
      .catch(error => reply.badImplementation(error));
  },
};
