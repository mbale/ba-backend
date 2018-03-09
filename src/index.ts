require('ts-node').register();

import MatchService from './service/match';
import TeamService from './service/team';
import Prediction from './entity/prediction';
import 'reflect-metadata';
import * as Hapi from 'hapi';
import * as Boom from 'boom';
import * as Blipp from 'blipp';
import * as Good from 'good';
import * as authJwt from 'hapi-auth-jwt2';
import * as Henning from 'henning';
import {
  createConnection, ConnectionOptions, getConnection,
} from 'typeorm';
import { ObjectID } from 'mongodb';
import * as dotenv from 'dotenv';
import routes from './routes';
import User from './entity/user';
import BookmakerReview from './entity/bookmaker-reviews';
import { EntityNotFoundError } from './errors';
import * as cloudinary from 'cloudinary';
import * as rabbot from 'rabbot';
import { rabbitMQConfig } from 'ba-common';

// import {
//   version,
// } from '../package.json';

// const applicationVersion = version;

dotenv.config();

const TEAM_SERVICE_URL = process.env.TEAM_SERVICE_URL;
const MATCH_SERVICE_URL = process.env.MATCH_SERVICE_URL;
const RABBITMQ_URI = process.env.RABBITMQ_URI;
const HTTP_PORT = process.env.BACKEND_HTTP_PORT;
const SENTRY_DNS = process.env.BACKEND_SENTRY_DNS;
const MONGODB_URL = process.env.BACKEND_MONGODB_URL;
const JWT_KEY = process.env.BACKEND_JWT_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.BACKEND_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.BACKEND_CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.BACKEND_CLOUDINARY_API_SECRET;

const server = new Hapi.Server();

// set default server
server.connection({
  port: HTTP_PORT || 3000,
  routes: {
    cors: {
      additionalExposedHeaders: ['count', 'Count'],
    },
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
        // ops: '*',
      }],
    }, {
      module: 'good-sentry',
      args: [{
        dsn: SENTRY_DNS,
        config: {
          // release: applicationVersion,
        },
        captureUncaught: true,
      }],
    }],
    console: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{
        // ops: '*',
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

    const exchanges = [
      {
        name: 'match-service',
        type: 'topic',
        persistent: true,
      },
      {
        name: 'team-service',
        type: 'topic',
        persistent: true,
      },
    ];

    const queues = [
      {
        name: 'match-service', autoDelete: true,
      },
      {
        name: 'team-service', autoDelete: true,
      },
    ];

    const bindings = [
      {
        exchange: 'match-service', target: 'match-service', keys: ['get-matches-by-ids'],
      },
      {
        exchange: 'team-service', target: 'team-service', keys: ['get-teams-by-ids'],
      },
    ];

    await rabbot.configure(rabbitMQConfig(RABBITMQ_URI, exchanges, queues, bindings));

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });

    const dbOptions : ConnectionOptions = {
      type: 'mongodb',
      url: MONGODB_URL,
      logging: ['query', 'error'],
      entities: [User, Prediction, BookmakerReview],
    };


    const connection = await createConnection(dbOptions);

    /*
      Service gateway health check
    */

    TeamService.initialize(TEAM_SERVICE_URL);
    MatchService.initialize(MATCH_SERVICE_URL);

    const pingResults = await Promise.all([
      TeamService.ping(),
      MatchService.ping(),
    ]);

    for (const pingResult of pingResults) {
      serverInstance
        .log(['info'],`Service on ${pingResult.baseURL} is accessible: ${pingResult.running}`);

      if (!pingResult.running) {
        serverInstance.log(['error'], pingResult.data);
      }
    }


    serverInstance.log(['info'], `DB's connected to ${connection.options.type}`);
    return next();
  } catch (error) {
    serverInstance.log(['error'], error);
    throw error;
  }
});

/*
  Plugin registration
 */

server.register({
  register: Henning,
  options: {
    whitelist: ['image/png', 'image/jpg', 'image/jpeg'],
  }},           (error) => {
  if (error) { throw error; }
});

// logger
server.register({ register: Good, options: goodReporterOptions }, (error) => {
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

// auth strategy

// register plugin
server.register(authJwt, (error) => {
  if (error) {
    throw error;
  }
});

// declare accesstoken validation logic for routes
server.auth.strategy('accessToken', 'jwt', {
  key: JWT_KEY,
  async validateFunc(decoded, request, callback) {
    try {
      // encoded token
      const {
        auth: {
          token: accessToken,
        },
      } = request;

      const credentials = {
        user: null,
        decodedToken: decoded, // we might not need this but pass it anyways
      };

      const repository = getConnection()
        .getMongoRepository<User>(User);

      // locate him by token
      const user = await repository.findOne({
        accessToken,
      });

      if (!user) {
        throw new EntityNotFoundError('User', 'accesstoken', accessToken);
      }

      // assign user entity to later usage in controller
      credentials.user = user;

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
