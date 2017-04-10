import UserModel from '~/models/userModel.js';
import _ from 'lodash';
import Promise from 'bluebird';

export default {
  /*
    Create new user
   */
  create(request, reply) {
    const {
      username: _username,
      password,
      email,
    } = request.payload;

    // trimming whitespaces & convert lowercase
    const username = _(_username).lowerCase().trim();

    // saving
    const newUser = new UserModel({
      username,
      password,
      email,
    });

    newUser
      .save()
      .then((user) => {
        reply(user);
      })
      .catch((error) => {
        if (error instanceof Error) {
          return reply.badImplementation(error);
        }
        return reply.conflict(error);
      });
  },
};
