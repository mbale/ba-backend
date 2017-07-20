import Utils from '~/utils.js';
import User from '~/models/user-model.js';
import EntityTakenError from '~/errors/entity-taken-error.js';
import EntityNotFoundError from '~/errors/entity-not-found-error.js';
import PasswordMismatchError from '~/errors/password-mismatch-error.js';

export default {
  async getPrivateProfile(request, reply) {
    try {
      const {
        auth: {
          credentials: {
            user,
          },
        },
      } = request;

      const profile = await user.getProfile({
        privateProfile: true,
      });

      // send back
      return reply(profile);
    } catch (error) {
      return reply.badImplementation(error);
    }
  },

  async uploadAvatar(request, reply) {
    try {
      const {
        auth: {
          credentials: {
            user,
          },
        },
        payload: {
          avatar: avatarStream,
        },
      } = request;

      await user.uploadAvatar(avatarStream);
      return reply();
    } catch (error) {
      return reply.badImplementation(error);
    }
  },

  async deleteAvatar(request, reply) {
    try {
      const {
        auth: {
          credentials: {
            user,
          },
        },
      } = request;

      await user.deleteAvatar();
      return reply();
    } catch (error) {
      return reply.badImplementation(error);
    }
  },

  async editProfile(request, reply) {
    try {
      const {
        payload: propsToEditInObj,
        auth: {
          credentials: {
            user,
          },
        },
      } = request;

      await user.editProfile(propsToEditInObj);
      return reply();
    } catch (error) {
      if (error instanceof EntityTakenError) {
        return reply.conflict(error.message);
      }
      return reply.badImplementation(error);
    }
  },

  async forgotPassword(request, reply) {
    try {
      const {
        payload: {
          email,
        },
      } = request;

      const user = await User.findOne({
        email,
      });

      if (!user) {
        throw new EntityNotFoundError('User', 'email', email);
      }

      await user.resetPassword();
      return reply();
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      }
      return reply.badImplementation(error);
    }
  },

  async getRecoveryTokenInformation(request, reply) {
    try {
      const {
        headers: {
          'recovery-token': recoveryToken,
        },
      } = request;

      const user = await User.findOne({
        recoveryToken,
      });

      if (!user) {
        throw new EntityNotFoundError('User', 'recoveryToken', recoveryToken);
      }

      // decode
      const {
        iat: issuedAt,
        exp: expiresAt,
      } = Utils.decodeJWTToken(recoveryToken);

      return reply({
        issuedAt,
        expiresAt,
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      }
      return reply.badImplementation(error);
    }
  },

  async resetPassword(request, reply) {
    try {
      const {
        payload: {
          recoveryToken,
          password,
        },
      } = request;

      const user = await User.findOne({
        recoveryToken,
      });

      if (!user) {
        throw new EntityNotFoundError('User', 'recoveryToken', recoveryToken);
      }

      await user.changePassword(password);
      user.set('recoveryToken', false);
      await user.save();
      return reply();
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      }
      return reply.badImplementation(error);
    }
  },

  async changePassword(request, reply) {
    try {
      const {
        auth: {
          credentials: {
            user,
          },
        },
        payload: {
          oldPassword,
          newPassword,
        },
      } = request;

      await user.comparePassword(oldPassword);
      // ok we change
      await user.changePassword(newPassword);

      return reply();
    } catch (error) {
      if (error instanceof PasswordMismatchError) {
        return reply.unauthorized(error.message);
      }
      return reply.badImplementation(error);
    }
  },
};
