/*
    Import packages
 */

import Hapi from 'hapi';
import Inert from 'inert';
import Path from 'path';
import Blipp from 'blipp';
import Good from 'good';
import HapiBoomDecorators from 'hapi-boom-decorators';
import Mongorito, {
  ObjectId,
} from 'mongorito';
import _ from 'lodash';
import authJwt from 'hapi-auth-jwt2';
import Config from '~/config.js';
import Routes from '~/routes';
import User from '~/models/userModel.js';
import AccessToken from '~/models/accessTokenModel.js';

let config;

// handling what environment we are and set config based on that
const env = process.env.NODE_ENV;
if (env === 'development') {
  config = Config.development;
} else {
  config = Config.production;
}

// store mixed config key-vals too
config.mixed = Config.mixed;

/*
  Bootstrap
 */

const populateServerOptionsObj = () => {
  const opt = {
    // registering config
    app: config,
  };

  // extend debug listener
  if (env === 'development') {
    opt.debug = {
      log: ['error'],
      request: ['error'],
    };
  }

  return opt;
};

// generate server config
const serverOptions = populateServerOptionsObj();

const server = new Hapi.Server(serverOptions);

// set default server
server.connection({
  port: process.PORT || config.http.port,
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
      args: [{
        log: '*', response: '*', error: '*', request: '*' }],
    }, {
      module: 'good-sentry',
      args: [server.settings.app.sentry],
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

server.ext('onPreStart', (server, next) => {
  const db = new Mongorito(server.settings.app.db.mongoURI);
  db.register(AccessToken);

  // assign db instance to server
  server.app.db = db;

  db
    .connect(server.settings.app.db.mongoURI)
    .then((connection) => {
      server.log(['info', 'database'], `DB's connected to ${connection.databaseName} at ${connection.serverConfig.host}:${connection.serverConfig.port}`);
      return next();
    })
    .catch((error) => {
      server.log(['error', 'database'], {
        message: 'Cannot connect to DB',
        data: error,
      });
      return next();
    });
});

// // hapi boom ext
// server.ext('onPreResponse', (request, reply) => {
//   const response = request.response;
//   // give flow back if reply isn't coming from boom
//   if (!response.isBoom) {
//     return reply.continue();
//   }
//   if (response.data) {
//     // attach boom additional data object to response
//     response.output.payload.data = response.data;
//   }
//   return reply(response);
// });

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
  key: server.settings.app.jwt.key,
  validateFunc(decoded, request, callback) {
    server.app.db.register(User);
    server.app.db.register(AccessToken);

    // encoded & decoded token
    const userId = new ObjectId(decoded.userId);
    const encodedToken = request.auth.token;

    const findUser = () => User.findById(userId);

    const findToken = () => AccessToken.findOne({
      rawToken: encodedToken,
    });

    return Promise
      .all([findUser(), findToken()])
      .then(([user, token]) => {
        // valid token, user
        if (token && user) {
          return callback(null, true);
        }
        return callback(false);
      });
  },
  verifyOptions: server.settings.app.jwt.verifyOptions,
});

// set always needed
server.auth.default('accessToken');

/*
  Registering routes
 */

// serve api documentation
server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    file: Path.join(__dirname, 'docs/index.html'),
  },
  config: {
    auth: false,
  },
});

// avatars
server.route({
  method: 'GET',
  path: '/uploads/avatar/{param*}',
  handler: {
    directory: {
      path: Path.join(__dirname, 'uploads/avatar'),
    },
  },
  config: {
    auth: false,
  },
});

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
  server.log(['info'], `Environment: '${process.env.NODE_ENV}'`);
});

// export server instance to logging purpose
// and to inject tests
export default server;
