import User from '~/models/userModel.js';
import UsernameNotFoundError from '~/models/errors/usernameNotFoundError.js';
import PasswordMismatchError from '~/models/errors/passwordMismatchError.js';
import {
  ObjectId,
} from 'mongorito';
import timestamps from 'mongorito-timestamps';
import Chance from 'chance';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import Promise from 'bluebird';

export default {
  /*
    Testing token
   */
  async test(request, reply) {
    const {
      userId,
      iat: issuedAt,
      exp: expiresAt,
    } = request.auth.credentials;

    // token, user it's connected to
    // token issued at
    // token exp fin unix timestamp
    try {
      reply({
        userId,
        issuedAt,
        expiresAt,
      });
    } catch (error) {
      reply.badImplementation(error);
    }
  },

  async revoke(request, reply) {
    const userId = request.auth.credentials.userId;
    const db = request.server.app.db;
    /*
      DB
     */
    db.register(User);

    try {
      const user = await User.findById(new ObjectId(userId));
      // setting token to empty
      await user.revokeAccess();
      reply();
    } catch (error) {
      reply.badImplementation(error);
    }
  },

  /*
    Basic authentication
   */
  async basic(request, reply) {
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
      username,
      password,
    } = request.payload;

    try {
      // find user
      const user = await User.findByUsername(username);
      // compare passwords
      await user.comparePassword(password);
      // issue request to get access, token
      await user.authorizeAccess();

      const {
        rawToken: accessToken,
        issuedAt,
        expiresAt,
      } = await user.get('accessToken');

      // sending
      reply({
        accessToken,
        issuedAt,
        expiresAt,
      });
    } catch (error) {
      if (error instanceof UsernameNotFoundError) {
        reply.unauthorized(error.message);
      } else if (error instanceof PasswordMismatchError) {
        reply.unauthorized(error.message);
      } else {
        reply.badImplementation(error);
      }
    }
  },

  /*
    Steam authentication
   */
  async steam(request, reply) {
    // steamapi access
    const steamAPIKey = process.env.STEAM_API_KEY;
    const db = request.server.app.db;
    db.register(User);
    db.use(timestamps());

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

    try {
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
        // we refresh steam data
        userInDb.set('steamProvider', steamProfileData);

        await userInDb.save(); // authorizeaccess already calls it btw
        await userInDb.authorizeAccess();

        reply(userInDb.get('accessToken'));
      } else {
        const userData = {
          username,
          password,
          email,
          avatar: steamProfileData.avatar.default,
          steamProvider: steamProfileData,
        };

        const alreadyUsername = await User.findOne({
          username,
        });

        if (alreadyUsername) {
          return reply.conflict('Username\'s taken');
        }

        // generate username
        if (!username || username === '') {
          userData.username = `${steamProfileData.personaname}#${chance.natural({
            max: 99999, // TODO CHECK UNIQUE
          })}`;
        }

        const user = new User(userData);
        await user.save();
        await user.authorizeAccess();

        reply(user.get('accessToken'));
      }
    } catch (error) {
      reply.badImplementation(error);
    }
  },
};
