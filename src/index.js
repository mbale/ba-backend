import Hapi from 'hapi';
import Boom from 'boom';
import Inert from 'inert';
import Blipp from 'blipp';
import Good from 'good';
import HapiBoomDecorators from 'hapi-boom-decorators';
import authJwt from 'hapi-auth-jwt2';
import Mongorito, {
  ObjectId,
} from 'mongorito';
import dotenv from 'dotenv';
import timestamps from 'mongorito-timestamps';
import routes from './routes';
import User from './models/user-model.js';
import Review from './models/review-model.js';
import Match from './models/match-model.js';
import Game from './models/game-model.js';
import League from './models/league-model.js';
import Team from './models/team-model.js';
import EntityNotFoundError from './errors/entity-not-found-error.js';
import {
  version,
} from '../package.json';

const applicationVersion = version;

dotenv.config();

const server = new Hapi.Server();

// set default server
server.connection({
  port: process.env.API_PORT || 3000,
  routes: {
    cors: true,
  },
});


// logger options
const goodReporterOptions = {
  ops: {
    interval: 30000, // ops refresh sequence
  },
  reporters: {
    sentry: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{
        error: '*',
        ops: '*',
      }],
    }, {
      module: 'good-sentry',
      args: [{
        dsn: process.env.SENTRY_DSN,
        config: {
          release: applicationVersion,
        },
        captureUncaught: true,
      }],
    }],
    console: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{
        log: '*',
        response: '*',
        error: '*',
        request: '*',
      }],
    }, {
      module: 'good-console',
    }, 'stdout'],
  },
};

server.ext('onPreStart', async (serverInstance, next) => {
  try {
    const db = new Mongorito(process.env.MONGO_URI);
    const connection = await db.connect();

    /*
      Dependency registration
    */

    db.use(timestamps());
    db.register(User);
    db.register(Review);
    db.register(Match);
    db.register(Team);
    db.register(League);
    db.register(Game);

    serverInstance.log(['info'], `DB's connected to ${connection.databaseName} at ${connection.serverConfig.host}:${connection.serverConfig.port}`);
    return next();
  } catch (error) {
    serverInstance.log(['error'], error);
    throw error;
  }
});

/*
  Plugin registration
 */

// boom decorator
server.register({
  register: HapiBoomDecorators,
}, (error) => {
  if (error) {
    throw error;
  }
});

// logger
server.register({
  register: Good,
  options: goodReporterOptions,
}, (error) => {
  if (error) {
    throw error;
  }
});

// show route table at startup
server.register(Blipp, (error) => {
  if (error) {
    throw error;
  }
});

// static file / directory handler
server.register(Inert, (error) => {
  if (error) {
    throw error;
  }
});

// auth strategy

// register plugin
server.register(authJwt, (error) => {
  if (error) {
    throw error;
  }
});

// declare accesstoken validation logic for routes
server.auth.strategy('accessToken', 'jwt', {
  key: process.env.JWT_KEY,
  async validateFunc(decoded, request, callback) {
    try {
      // decoded token
      let {
        userId,
      } = decoded;

      // encoded token
      const {
        auth: {
          token: accessToken,
        },
      } = request;

      userId = new ObjectId(userId);

      const credentials = {
        user: null,
        decodedToken: decoded, // we might not need this but pass it anyways
      };

      // first we find by userid
      const userById = await User.findById(userId);
      // then by token
      const userByToken = await User.findOne({
        'accessToken.accessToken': accessToken,
      });

      // check each case
      if (!userById) {
        throw new EntityNotFoundError('User', 'id', userId);
      }

      if (!userByToken) {
        throw new EntityNotFoundError('User', 'accesstoken', accessToken);
      }

      // assign user entity to later usage in controller
      credentials.user = userById;

      // everything's ok
      return callback(null, true, credentials);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        const boomError = Boom.wrap(error, 401); // with unauthorized
        return callback(boomError, false);
      }
      return callback(error, false);
    }
  },
  verifyOptions: {
    algorithms: ['HS256'],
  },
});

// set always needed
server.auth.default('accessToken');

/*
  Registering routes
 */

for (const route in routes) {
  if (Object.prototype.hasOwnProperty.call(routes, route)) {
    server.route(routes[route]);
  }
}

/*
  Start server
 */

server.start((error) => {
  if (error) {
    throw error;
  }

  server.log(['info'], `Server has started at: ${server.info.uri}`);
});

// export server instance to logging purpose
// and to inject tests
export default server;
