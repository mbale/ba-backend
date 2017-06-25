import _ from 'lodash';
import timestamps from 'mongorito-timestamps';
import UsernameTakenError from '~/models/errors/usernameTakenError.js';
import EmailTakenError from '~/models/errors/emailTakenError.js';
import User from '~/models/userModel.js';
import UsernameNotFoundError from '~/models/errors/usernameNotFoundError.js';

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

    db.use(timestamps());
    db.register(User);

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

  /*
    Get user by username
   */
  async getByUsername(request, reply) {
    try {
      /*
      Db
       */
      const {
        server: {
          app: {
            db,
          },
        },
      } = request;

      db.register(User);

      /*
        Data
       */
      const {
        params: {
          username: usernameToFind,
        },
      } = request;

      const user = await User.findOne({
        username: usernameToFind,
      });

      if (!user) {
        throw new UsernameNotFoundError(usernameToFind);
      }

      const {
        _id: id,
        username,
        avatar,
        steamProvider,
      } = await user.get();

      const replyObj = {
        id,
        username,
        avatar,
      };

      // check if steamprovider is set up
      if (Object.keys(steamProvider).length > 0) {
        replyObj.steamProvider = steamProvider;
      }

      return reply(replyObj);
    } catch (error) {
      if (error instanceof UsernameNotFoundError) {
        return reply.notFound(error.message);
      }
      return reply.badImplementation(error);
    }
  },
};
