import {
  ObjectId,
} from 'mongorito';
import User from '../models/user-model.js';
import EntityNotFoundError from '../errors/entity-not-found-error.js';
import EntityTakenError from '../errors/entity-taken-error.js';

class UsersController {
  static async createUser(request, reply) {
    try {
      const {
        payload: {
          username,
          password,
          email,
        },
      } = request;

      let user = {
        username,
        password,
      };

      // optional email
      if (email) {
        user.email = email;
      }

      user = new User(user);

      const {
        id,
      } = await user.save();

      const {
        accessToken,
        issuedAt,
        expiresAt,
      } = await user.authorizeAccess(id);

      return reply({
        accessToken,
        issuedAt,
        expiresAt,
        user: await user.getProfile({
          privateProfile: true,
        }),
      });
    } catch (error) {
      if (error instanceof EntityTakenError) {
        return reply.conflict(error.message);
      }
      return reply.badImplementation(error);
    }
  }

  static async getUsers(request, reply) {
    try {
      const {
        query: {
          userid: userId,
        },
      } = request;

      // it's undefined when query is absent and want to list all user
      if (!userId) {
        const users = await User.find();
        const usersMapped = [];

        for (const user of users) {
          const profile = user.getProfile();
          usersMapped.push(profile);
        }
        return reply(await Promise.all(usersMapped));
      }

      let userIds = [];

      // check if requests contains only one userid as string
      if (!(userId instanceof Array) && userId) {
        userIds.push(userId);
      } else { // or array with userids
        userIds = userId;
      }

      // convert each to objectid
      userIds = userIds.map(uid => new ObjectId(uid));

      let users = userIds.map(uid => User.findById(uid));
      users = await Promise.all(users);
      // filter out nulls
      users = users.filter(user => user);
      // get profiles
      users = users.map(user => user.getProfile());

      users = await Promise.all(users);

      return reply(users);
    } catch (error) {
      return reply.badImplementation(error);
    }
  }

  static async getPublicProfileByUsername(request, reply) {
    try {
      const {
        params: {
          username,
        },
      } = request;

      const user = await User.findOne({
        username,
      });

      if (!user) {
        throw new EntityNotFoundError('User', 'username', username);
      }

      const profile = await user.getProfile();

      return reply(profile);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      }
      return reply.badImplementation(error);
    }
  }
}

export default UsersController;
