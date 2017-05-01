const Config = {
  development: {
    sentry: {
      dsn: 'https://c7d43b2abbc64a7ea88a015d6dcaf9d8:4c7f805731c347b48f01f4221b79a881@sentry.io/163464',
      config: {
        environment: process.env.NODE_ENV,
      },
      captureUncaught: true,
    },
    http: {
      port: '1337',
    },
    email: {
      smtp: {
        host: 'smtp.mailtrap.io',
        port: 2525,
        auth: {
          user: 'd5d6aa0d2a1ead',
          pass: '1840d940ef46ef',
        },
      },
      recover: {
        from: '"Recover Account" <recover@esportsinsights.com>',
        subject: 'Here\'s your info to recover your acccount',
      },
    },
    db: {
      mongoURI: 'mongodb://esportsinsight:dev@146.185.169.74:27017/esportsinsight',
    },
    steam: {
      key: '3DA957DF188C639D76778915B4CCFDBA',
    },
    jwt: {
      key: 'dev',
      options: {
        expiresIn: '14 days',
      },
      verifyOptions: {
        algorithms: ['HS256'],
      },
    },
  },
  mixed: {
    ex: '',
  },
  production: {
    http: {
      port: '5000',
    },
  },
};

export default Config;
