const Config = {
  development: {
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
