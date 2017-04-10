const Config = {
  development: {
    http: {
      port: '1337',
    },
    db: {
      mongoURI: 'mongodb://esportsinsight:dev@146.185.169.74:27017/esportsinsight',
    },
    jwt: {
      key: 'dev',
      options: {
        expiresIn: '14 days',
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
