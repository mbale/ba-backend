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
    try {
      const {
        server: {
          app: {
            db,
          },
        },
        payload: {
          username: _username,
          password,
          email,
        },
      } = request;

      db.use(timestamps());
      db.register(User);

      // trimming whitespaces & convert lowercase
      const username = _username.toLowerCase();

      const userObj = {
        username,
        password,
      };

      // optional email
      if (email) {
        userObj.email = email;
      }

      const user = new User(userObj);

      const {
        id,
      } = await user.save();
      const {
        rawToken: accessToken,
        issuedAt,
        expiresAt,
      } = await user.authorizeAccess(id);

      return reply({
        accessToken,
        issuedAt,
        expiresAt,
      });
    } catch (error) {
      if (error instanceof UsernameTakenError) {
        return reply.conflict(error.message);
      } else if (error instanceof EmailTakenError) {
        return reply.conflict(error.message);
      }
      return reply.badImplementation(error);
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
          userid: userId,
        },
      } = request;

      db.register(User);

      // it's undefined when query is absent and want to list all user
      if (!userId) {
        const users = await User.find();
        const usersMapped = [];

        for (const user of users) { // eslint-disable-line
          const {
            _id: id,
            username,
            email,
            avatar,
            created_at: registeredOn,
            steamProvider,
          } = await user.get(); // eslint-disable-line
          usersMapped.push({
            id,
            username,
            email,
            avatar,
            registeredOn,
            steamProvider,
          });
        }
        return reply(usersMapped);
      }

      let userIds = [];

      // check if requests contains only one userid as string
      if (!(userId instanceof Array) && userId) {
        userIds.push(userId);
      } else { // or array with userids
        userIds = userId;
      }

      // convert each to objectid
      const usersIdsMappedToObjectId = userIds.map(uid => new ObjectId(uid));
      const usersRequested = [];

      // find all user
      for (let userIdRequested of usersIdsMappedToObjectId) { // eslint-disable-line
        let user = await User.findById(userIdRequested);  // eslint-disable-line

        // check if we have user
        if (user) {
          const {
            _id: id,
            username,
            email,
            avatar,
            created_at: registeredOn,
            steamProvider,
          } = await user.get(); // eslint-disable-line

          // check if we already have it queried
          const alreadyQueried = usersRequested.find(u => u.username === username);

          if (!alreadyQueried) {
            usersRequested.push({
              id,
              username,
              email,
              avatar,
              registeredOn,
              steamProvider,
            });
          }
        }
      }
      return reply(usersRequested);
    } catch (error) {
      return reply.badImplementation(error);
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
