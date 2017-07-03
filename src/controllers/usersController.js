import _ from 'lodash';
import {
  ObjectId,
} from 'mongorito';
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

  async getUsers(request, reply) {
    try {
      const {
        server: {
          app: {
            db,
          },
        },
        query: {
          userid: userIds = [], // optional so we set empty array default
        },
      } = request;

      db.register(User);

      // convert each to objectid
      const usersIdsMappedToObjectId = userIds.map(userId => new ObjectId(userId));
      const usersRequested = [];

      // find all user
      for (let userIdRequested of usersIdsMappedToObjectId) { // eslint-disable-line
        let user = await User.findById(userIdRequested);  // eslint-disable-line

        const {
          _id: id,
          username,
          email,
          avatar,
          created_at: registeredOn,
          steamProvider,
        } = await user.get(); // eslint-disable-line

        usersRequested.push({
          id,
          username,
          email,
          avatar,
          registeredOn,
          steamProvider,
        });
      }

      return reply(usersRequested);
    } catch (error) {
      reply.badImplementation(error);
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
        created_at: registeredOn,
      } = await user.get();

      const replyObj = {
        id,
        username,
        avatar,
        registeredOn,
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
