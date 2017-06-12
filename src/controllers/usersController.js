import _ from 'lodash';
import timestamps from 'mongorito-timestamps';
import UsernameTakenError from '~/models/errors/usernameTakenError.js';
import EmailTakenError from '~/models/errors/emailTakenError.js';
import User from '~/models/userModel.js';

export default {
  /*
    Create new user
   */
  async create(request, reply) {
    /*
    DB
     */
    const {
      db,
    } = request.server.app;

    db.register(User);
    db.use(timestamps());

    /*
    Data
     */
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

    /*
    Save
     */
    const user = new User(userObj);

    try {
      await user.save();
      reply();
    } catch (error) {
      if (error instanceof UsernameTakenError) {
        reply.conflict(error.message);
      } else if (error instanceof EmailTakenError) {
        reply.conflict(error.message);
      } else {
        reply.badImplementation(error);
      }
    }
  },
};
