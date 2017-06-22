import Hapi from 'hapi';
import Inert from 'inert';
import Blipp from 'blipp';
import Good from 'good';
import HapiBoomDecorators from 'hapi-boom-decorators';
import authJwt from 'hapi-auth-jwt2';
import Mongorito, { ObjectId } from 'mongorito';
import _ from 'lodash';
import dotenv from 'dotenv';
import Routes from '~/routes';
import User from '~/models/userModel.js';

dotenv.config();

const server = new Hapi.Server();

// set default server
server.connection({
  port: process.env.PORT || 3000,
  routes: {
    cors: true,
  },
});


// logger options
const goodReporterOptions = {
  ops: {
    interval: 15000, // ops refresh sequence
  },
  reporters: {
    sentry: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{ log: '*', response: '*', error: '*', request: '*' }],
    }, {
      module: 'good-sentry',
      args: [{
        dsn: process.env.SENTRY_DSN,
        config: {
          environment: 'dev',
        },
        captureUncaught: true,
      }],
    }],
    console: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{
        log: '*', response: '*', error: '*', request: '*',
      }],
    }, {
      module: 'good-console',
    }, 'stdout'],
  },
};

server.ext('onPreStart', async (server, next) => {
  const db = new Mongorito(process.env.MONGO_URI);

  // assign db instance to server
  const serverInstance = server;
  serverInstance.app.db = db;

  try {
    const connection = await db.connect(process.env.MONGO_URI);
    server.log(['info'], `DB's connected to ${connection.databaseName} at ${connection.serverConfig.host}:${connection.serverConfig.port}`);
    return next();
  } catch (error) {
    server.log(['error'], error);
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
    server.app.db.register(User);

    // encoded & decoded token
    const userId = new ObjectId(decoded.userId);
    const encodedToken = request.auth.token;

    try {
      const user = await User.findById(userId);

      const {
        rawToken,
      } = await user.get('accessToken');

      if (rawToken === encodedToken) {
        // everything's ok
        return callback(null, true);
      }
    } catch (error) {
      // check for "haxors"
      return callback(false);
    }
    return callback(false);
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

// add each route
_.forEach(Routes, (route) => {
  server.route(route);
});

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
