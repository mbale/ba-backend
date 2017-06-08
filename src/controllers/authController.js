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
      username, // only when user submits otherwise generate
      password, // optional
      email, // optional
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
      'steamProvider.steamid': steamData.steamid,
    });

    // if it's authenticated then get user based on token information
    //  refresh steamProvider data when it's already steamprovided
    if (isLoggedIn) {
      query.push({
        _id: new ObjectId(auth.credentials.userId),
      });
    }

    const user = User.findById();

    // query.push({
    //   'steamProvider.steamid': steamData.steamid,
    // });
    // // check for user data in db
    // const checkUser = (response) => {
    //   // requested steam data with steamid
    //   const steamData = response.data.response.players[0];
    //   const query = [{
    //     'steamProvider.steamid': steamData.steamid,
    //   }];

    //   // if it's authenticated then get user based on token information
    //   // refresh steamProvider data when it's already steamprovided
    //   if (isLoggedIn) {
    //     query.push({
    //       _id: new ObjectId(auth.credentials.userId),
    //     });
    //   }
    //   // find possible duplicate data
    //   return User
    //     .or(query)
    //     .findOne()
    //     .then((user) => {
    //       if (user) {
    //         user.set('steamProvider', steamData);
    //         return Promise.reject(user);
    //       }
    //       return steamData;
    //     });
    // };

    // // get user based on tokenid
    // const addNewUser = (steamdata) => {
    //   // it's not submitted with token => signup user
    //   const userObj = {
    //     username: '',
    //     password,
    //     email,
    //     steamProvider: steamdata,
    //   };

    //   if (!username || username === '') {
    //     userObj.username = `${steamdata.personaname}#${chance.natural({
    //       max: 99999,
    //     })}`;
    //   }

    //   // creating new user
    //   const newUser = new User(userObj);
    //   return newUser.save().then(() => newUser);
    // };

    // // called from checkuser
    // // we jump after addnewuser
    // const alreadyInTheSystem = user => user;

    // // generate and sign token with userid
    // const generateToken = (user) => {
    //   const rawToken = jwt.sign({
    //     userId: user.get('_id'),
    //   }, jwtConfig.key, {
    //     expiresIn: '14 days',
    //   });

    //   const token = new AccessToken({
    //     userId: user.get('_id'),
    //     rawToken,
    //   });

    //   return token.save().then(() => rawToken);
    // };

    // // send out accesstoken
    // const successHandler = accessToken => reply({
    //   accessToken,
    // });

    // const errorHandler = (error) => {
    //   switch (error.code) {
    //   default:
    //     return reply.badImplementation(error);
    //   }
    // };

    // return axios
    //   .get(steamUserAPIUrl)
    //   .then(checkUser)
    //   .then(addNewUser, alreadyInTheSystem)
    //   .then(generateToken)
    //   .then(successHandler)
    //   .catch(errorHandler);
  },
};
