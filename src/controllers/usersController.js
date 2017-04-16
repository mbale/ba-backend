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
    const username = _(_username).toLower().trim();

    const userObj = {
      username,
      password,
    };

    // optional email
    if (email) {
      userObj.email = email;
    }

    // saving
    const newUser = new UserModel(userObj);

    newUser
      .save()
      .then(() => reply())
      .catch((error) => {
        if (error instanceof Error) {
          return reply.badImplementation(error);
        }
        return reply.conflict(null, error);
      });
  },
};
