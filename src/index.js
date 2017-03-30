/*
    Import packages
 */

import Hapi from 'hapi';
import Inert from 'inert';
import Path from 'path';
import Blipp from 'blipp';
import Good from 'good';
import HapiBoomDecorators from 'hapi-boom-decorators';
import _ from 'lodash';
import Config from '~/config.js';
import Routes from '~/routes';

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
  port: config.http.port,
  routes: {
    cors: true,
  },
});


// logger options
const goodReporterOptions = {
  ops: {
    interval: 1000, // bind refresh sequence
  },
  reporters: {
    // dev & prod
    console: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{
        log: '*', response: '*', error: '*',
      }],
    }, {
      module: 'good-console',
    }, 'stdout'],
    // todo file - prod only
  },
};

// log incoming request's payload
server.on('tail', (request) => {
  server.log(['request'], request.payload);
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

/*
  Registering routes
 */

// serve client application
server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: Path.join(__dirname, 'client'),
      listing: true,
    },
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
