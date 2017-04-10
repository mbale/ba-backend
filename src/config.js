const Config = {
  development: {
    http: {
      port: '1337',
    },
    db: {
      mongoURI: 'mongodb://esportsinsight:dev@146.185.169.74:27017/esportsinsight',
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
