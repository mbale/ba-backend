import {
  ObjectId,
} from 'mongorito';
// it will be removed by refactored steaam auth
import Chance from 'chance';
import axios from 'axios';
import UsernameTakenError from '../errors/usernameTakenError.js';
import EmailTakenError from '../errors/emailTakenError.js';
// it will be obsolete by refactoring steaam auth
import User from '../models/user-model.js';
import EntityNotFoundError from '../errors/entity-not-found-error.js';
import PasswordMismatchError from '../errors/password-mismatch-error.js';

class AuthController {
  static async getAccessTokenInformation(request, reply) {
    try {
      const {
        auth: {
          credentials: {
            decodedToken: {
              userId,
              iat: issuedAt,
              exp: expiresAt,
            },
          },
        },
      } = request;

      return reply({
        userId,
        issuedAt,
        expiresAt,
      });
    } catch (error) {
      return reply.badImplementation(error);
    }
  }

  static async revokeAccessToken(request, reply) {
    try {
      const {
        auth: {
          credentials: {
            user,
          },
        },
      } = request;

      // revoke access
      await user.revokeAccess();
      return reply();
    } catch (error) {
      return reply.badImplementation(error);
    }
  }

  static async refreshAccessToken(request, reply) {
    try {
      const {
        auth: {
          credentials: {
            user,
          },
        },
      } = request;

      const {
        rawToken: accessToken,
        issuedAt,
        expiresAt,
      } = await user.authorizeAccess();

      return reply({
        accessToken,
        issuedAt,
        expiresAt,
      });
    } catch (error) {
      return reply.badImplementation(error);
    }
  }

  static async basicAuthentication(request, reply) {
    try {
      const {
        payload: {
          username,
          password,
        },
      } = request;

      const user = await User.findOne({
        username,
      });

      if (!user) {
        throw new EntityNotFoundError('User', 'name', username);
      }

      // compare passwords
      await user.comparePassword(password);

      // issue request to get access, token
      await user.authorizeAccess();

      const {
        accessToken,
        issuedAt,
        expiresAt,
      } = await user.get('accessToken');

      return reply({
        accessToken,
        issuedAt,
        expiresAt,
        user: await user.getProfile({
          privateProfile: true,
        }),
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      } else if (error instanceof PasswordMismatchError) {
        return reply.unauthorized(error.message);
      }
      return reply.badImplementation(error);
    }
  }

  static async steam(request, reply) {
    try {
      // steamapi access
      const steamAPIKey = process.env.STEAM_API_KEY;

      // isLoggedIn === true & auth != null => authenticate user
      const {
        auth,
        auth: {
          isAuthenticated: isLoggedIn,
        },
      } = request;

      // for username generation
      const chance = new Chance();

      const {
        steamId, // required
        username = false, // only when user submits otherwise generate
        password = false, // optional
        email = false, // optional
      } = request.payload;

      // api url which can give us steam profile data
      const steamUserAPIUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamAPIKey}&steamids=${steamId}`;

      // getting steam data
      const {
        data: {
          response: {
            players,
          },
        },
      } = await axios.get(steamUserAPIUrl);

      const steamData = players[0];

      // check which fields we need to search for
      const query = [];

      query.push({
        'steamProvider.steamId': steamData.steamid,
      });

      // if it's authenticated then get user based on token information
      //  refresh steamProvider data when it's already steamprovided
      if (isLoggedIn) {
        query.push({
          _id: new ObjectId(auth.credentials.userId),
        });
      }
      // restruct steamdata
      const {
        communityvisibilitystate: communityVisibilityState,
        personaname,
        lastlogoff: lastLogoff,
        profileurl: profileURL,
        avatar: avatarDefault,
        avatarmedium: avatarMedium,
        avatarfull: avatarHigh,
        personastate: personaState,
        primaryclanid: primaryClanId,
        timecreated: timeCreated,
        personastateflags: personaStateFlags,
        loccountrycode: locCountryCode,
        locstatecode: locStateCode,
        loccityid: locCityId,
      } = steamData;

      // we store it like this
      const steamProfileData = {
        steamId,
        communityVisibilityState,
        personaname,
        lastLogoff,
        profileURL,
        avatar: {
          default: avatarDefault,
          medium: avatarMedium,
          high: avatarHigh,
        },
        personaState,
        primaryClanId,
        timeCreated,
        personaStateFlags,
        locCountryCode,
        locStateCode,
        locCityId,
      };

      // find
      const userInDb = await User.or(query).findOne();

      if (userInDb) {
        // we update steam data
        userInDb.set('steamProvider', steamProfileData);
        await userInDb.authorizeAccess();

        const {
          rawToken: accessToken,
          issuedAt,
          expiresAt,
        } = await userInDb.get('accessToken');

        reply({
          accessToken,
          issuedAt,
          expiresAt,
          user: await userInDb.getProfile({
            privateProfile: true,
          }),
        });
      } else {
        const userData = {
          username,
          password,
          email,
          avatar: steamProfileData.avatar.default,
          steamProvider: steamProfileData,
          countryCode: locCountryCode,
        };

        if (!username || username === '') {
          // we make sure we've unique name with number
          let numberNeedsToGenerated = true;

          while (numberNeedsToGenerated) {
            // generate a username with steam name and random generated number
            const usernameToTest = `${steamProfileData.personaname}_${chance.natural({
              max: 99999,
            })}`;
            const isUsernameTaken = await User.findOne({ // eslint-disable-line
              username: usernameToTest,
            });

            if (!isUsernameTaken) {
              numberNeedsToGenerated = false; // we passes
              userData.username = usernameToTest; // assign new username
            }
          }
        }

        // we save it before due to generation of _id (we use that in token)
        // pls: https://github.com/vadimdemedes/mongorito/issues/156
        let {
          id: userId,
        } = await new User(userData).save();
        userId = new ObjectId(userId);

        const user = await User.findById(userId);
        await user.authorizeAccess();

        const {
          accessToken,
          issuedAt,
          expiresAt,
        } = await user.get('accessToken');

        reply({
          accessToken,
          issuedAt,
          expiresAt,
          user: await user.getProfile({
            privateProfile: true,
          }),
        });
      }
    } catch (error) {
      if (error instanceof EmailTakenError) {
        reply.conflict(error.message);
      } else if (error instanceof UsernameTakenError) {
        reply.conflict(error.message);
      } else {
        reply.badImplementation(error);
      }
    }
  }
}

export default AuthController;
