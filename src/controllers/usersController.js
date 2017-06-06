import User from '~/models/userModel.js';
import UserPlugins from '~/models/plugins/userPlugins.js';
import _ from 'lodash';
import timestamps from 'mongorito-timestamps';
import Promise from 'bluebird';

const {
  hashPassword,
} = UserPlugins;

export default {
  /*
    Create new user
   */
  async create(request, reply) {
    const {
      username: _username,
      password,
      email,
    } = request.payload;

    const db = request.server.app.db;
    db.register(User);
    db.use(timestamps());
    User.use(hashPassword);

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
    const user = new User(userObj);

    try {
      await user.save();
      reply();
    } catch (error) {
      switch (error.code) {
      case 0:
        reply.conflict('Username already exists.');
        break;
      case 1:
        reply.conflict('Email already exists');
        break;
      case 2:
        reply.conflict(error.data);
        break;
      default:
        reply.badImplementation(error);
      }
    }
  },
};
