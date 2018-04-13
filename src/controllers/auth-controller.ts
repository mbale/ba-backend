
import * as Chance from 'chance';
import { badImplementation, notFound, unauthorized, conflict, badData } from 'boom';
import * as dotenv from 'dotenv';
import { AxiosError } from 'axios';
import { getConnection } from 'typeorm';
import { Request, Response, ReplyNoContinue, ReplyWithContinue } from 'hapi';
import {
  EntityNotFoundError,
  EntityTakenError,
  PasswordMismatchError,
  InvalidSteamIdError,
} from '../errors';
import User, {
  SteamProvider,
} from '../entity/user';
import { tryQuerySteamData, uploadToCloudinary } from '../utils';

dotenv.config();

const STEAM_API_KEY = process.env.BACKEND_STEAM_API_KEY;

class AuthController {
  /**
   * Removes access token grant from user
   *
   * @static
   * @param {Request} request
   * @param {ReplyWithContinue} reply
   * @returns {Promise<Response>}
   * @memberof AuthController
   */
  static async revokeAccessToken(request : Request, reply : ReplyWithContinue) : Promise<Response> {
    try {
      const user : User = request.auth.credentials.user;

      const repository = getConnection()
        .getMongoRepository<User>(User);

      // revoke access
      user.revokeTokenAccess();

      await repository.save(user);

      return reply();
    } catch (error) {
      return reply(badImplementation(error));
    }
  }

  /**
   * Authenticates user with username and password combination
   *
   * @static
   * @param {Request} request
   * @param {ReplyWithContinue} reply
   * @returns {Promise<Response>}
   * @memberof AuthController
   */
  static async basicAuth(request : Request, reply : ReplyWithContinue) : Promise<Response> {
    try {
      const {
        payload: {
          username,
          password,
        },
      } = request;

      const repository = getConnection()
        .getMongoRepository<User>(User);

      const user = await repository.findOne({
        username,
      });

      if (!user) {
        throw new EntityNotFoundError('User', 'name', username);
      }

      // compare passwords
      const passwordMatch = await user.comparePassword(password);

      if (!passwordMatch) {
        throw new PasswordMismatchError(username, password);
      }

      // issue request to get access, token
      const accessToken = user.authorizeAccess();

      await repository.save(user);

      return reply({
        accessToken,
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply(notFound(error.message));
      }
      if (error instanceof PasswordMismatchError) {
        return reply(unauthorized(error.message));
      }
      return reply(badImplementation(error));
    }
  }

  /**
   * Endpoint to authenticate and register with openID compatible steamID
   *
   * @static
   * @param {Request} request
   * @param {ReplyWithContinue} reply
   * @returns {Promise<Response>}
   * @memberof AuthController
   */
  static async steamAuth(request : Request, reply : ReplyWithContinue) : Promise<Response> {
    try {
      // request data
      const {
        payload: {
          steamId, // required
        },
      } : {
        payload: {
          steamId : string,
        },
      } = request;
      // we check if user is authenticated already with basic
      // so we can attach steam data to him
      const auth = request.auth;
      const loggedIn = auth.isAuthenticated;
      // for generating username if it's needed
      const chance = new Chance();

      const connection = getConnection();
      const userRepository = connection.getMongoRepository<User>(User);

      /*
        Fetching steam data and get user based on steamId if any
      */

      let userWithSteamId = await userRepository.findOne({
        where: {
          'steamProvider.steamId': steamId,
        },
      });

      let steamData : SteamProvider = null;

      try {
        // get steam data anyway
        steamData = await tryQuerySteamData(steamId, STEAM_API_KEY);
      } catch (e) {
        throw new InvalidSteamIdError(steamId);
      }

      /*
        We didn't find any user, so let's create it
      */
      if (!userWithSteamId) {
        userWithSteamId = new User();

        // true until we find unique name
        let usernameNeedsToGenerated = true;
        let generatedUsername : string = null;

        /*
          Username generation
        */
        while (usernameNeedsToGenerated) {
          // generate a name
          generatedUsername = `${steamData.personaname}_${chance.natural({
            max: 99999,
          })}`;

          const nameMatch = await userRepository.findOne({
            username: generatedUsername,
          });

          // then we found the good one
          if (!nameMatch) {
            usernameNeedsToGenerated = false;
          }
        }

        // set some default variable
        userWithSteamId.username = generatedUsername;
        userWithSteamId.countryCode = steamData.iocCountryCode;
        // save avatar from steam
        const {
          public_id,
        } : {
          public_id: string,
        } = await uploadToCloudinary(steamData.avatar.high, {
          folder: 'avatars',
        });
        userWithSteamId.avatar = public_id;
      }

      /*
        Update user's steam data
      */

      userWithSteamId.steamProvider = steamData;

      /*
        Issue access
      */

      const accessToken = userWithSteamId.authorizeAccess();

      await userRepository.save(userWithSteamId);

      return reply({
        accessToken,
      });
    } catch (error) {
      if (error instanceof InvalidSteamIdError) {
        return reply(badData(error.message));
      }
      return reply(badImplementation(error));

    }
  }

  /**
   * Issue a recovery process on behalf of user
   *
   * @static
   * @param {Request} request
   * @param {ReplyWithContinue} reply
   * @returns {Promise<Response>}
   * @memberof AuthController
   */
  static async forgotPassword(request : Request, reply : ReplyWithContinue) : Promise<Response> {
    try {
      const {
        payload: {
          email,
        },
      } = request;

      const repository = getConnection()
        .getMongoRepository<User>(User);

      const user = await repository.findOne({
        email,
      });

      if (!user) {
        throw new EntityNotFoundError('User', 'email', email);
      }

      await user.resetPassword();
      await repository.save(user);

      return reply();
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply(notFound(error.message));
      }
      return reply(badImplementation(error));
    }
  }

  /**
   * Set up new password for user if he'd forgotten
   *
   * @static
   * @param {Request} request
   * @param {ReplyWithContinue} reply
   * @returns {Promise<Response>}
   * @memberof AuthController
   */
  static async resetPassword(request : Request, reply : ReplyWithContinue) : Promise<Response> {
    try {
      const {
        payload: {
          recoveryToken,
          password,
        },
      } = request;

      const repository = getConnection()
        .getMongoRepository<User>(User);

      const user = await repository.findOne({
        recoveryToken,
      });

      if (!user) {
        throw new EntityNotFoundError('User', 'recoveryToken', recoveryToken);
      }

      user.password = password;
      user.recoveryToken = '';

      await user.hashPassword();
      await repository.save(user);
      return reply();
    } catch (error) {

      if (error instanceof EntityNotFoundError) {
        return reply(notFound(error.message));
      }
      return reply(badImplementation(error));
    }
  }
}

export default AuthController;
