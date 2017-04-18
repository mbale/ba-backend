const Config = {
  development: {
    sentry: {
      dsn: 'https://52176ecdf2dc41a1aed320396913dd60:3dec3fe8a14f4d8a880ce382b31b9de3@sentry.io/159228',
      config: {
        environment: process.env.NODE_ENV,
      },
      captureUncaught: true,
    },
    http: {
      port: '1337',
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
