export default {
  AUTH: {
    BASIC: {
      USERNAME_REQUIRED: {
        error: 'UsernameMissing',
        message: 'Username\'s missing',
      },
      PASSWORD_REQUIRED: {
        error: 'PasswordMissing',
        message: 'Password\'s required',
      },
      FIELD_EMPTY: {
        error: 'FieldEmpty',
        message: '',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
    STEAM: {
      STEAMID_REQUIRED: {
        error: 'SteamIDMissing',
        message: 'SteamID\'s missing',
      },
      EMAIL_INVALID: {
        error: 'EmailInvalid',
        message: 'Email\'s invalid',
      },
      PASSWORD_TOO_SHORT: {
        error: 'PasswordTooShort',
        message: 'Password\'s minimum 6 length',
      },
      FIELD_EMPTY: {
        error: 'FieldEmpty',
        message: '',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
  },
  USER: {
    EDIT_PROFILE: {
      EMAIL_INVALID: {
        error: 'EmailInvalid',
        message: 'Email\'s invalid',
      },
      REQUEST_EMPTY: {
        error: 'RequestEmpty',
        message: 'Request\'s empty',
      },
      FIELD_EMPTY: {
        error: 'FieldEmpty',
        message: '',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
    RESET_ACCOUNT: {
      EMAIL_INVALID: {
        error: 'EmailInvalid',
        message: 'Email\'s invalid',
      },
      EMAIL_REQUIRED: {
        error: 'EmailMissing',
        message: 'Email\'s missing',
      },
      FIELD_EMPTY: {
        error: 'FieldEmpty',
        message: '',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
    TEST_RECOVERYHASH: {
      HASH_REQUIRED: {
        error: 'RecoveryhashMissing',
        message: 'Recovery hash\'s missing',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
    RECOVER_ACCOUNT: {
      HASH_REQUIRED: {
        error: 'RecoveryhashMissing',
        message: 'Recovery hash\'s missing',
      },
      PASSWORD_REQUIRED: {
        error: 'PasswordMissing',
        message: 'Password\'s missing',
      },
      FIELD_EMPTY: {
        error: 'FieldEmpty',
        message: '',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
    CHANGE_PASSWORD: {
      PASSWORD_REQUIRED: {
        error: 'PasswordMissing',
        message: 'Password\'s missing',
      },
      REQUEST_EMPTY: {
        error: 'RequestEmpty',
        message: 'Request\'s empty',
      },
      PASSWORD_TOO_SHORT: {
        error: 'PasswordTooShort',
        message: 'Password\'s minimum 6 length',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
  },
  USERS: {
    CREATE: {
      USERNAME_REQUIRED: {
        error: 'UsernameMissing',
        message: 'Username\'s missing',
      },
      PASSWORD_REQUIRED: {
        error: 'PasswordMissing',
        message: 'Password\'s missing',
      },
      PASSWORD_TOO_SHORT: {
        error: 'PasswordTooShort',
        message: 'Password\'s minimum 6 length',
      },
      EMAIL_INVALID: {
        error: 'EmailInvalid',
        message: 'Email\'s invalid',
      },
      FIELD_EMPTY: {
        error: 'FieldEmpty',
        message: '',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
  },
  SPORTSBOOKS: {
    GETALL: {
      LIMIT_MIN: {
        error: 'LimitMin',
        message: 'Limit\'s minimum 1',
      },
      LIMIT_MAX: {
        error: 'LimitMax',
        message: 'Limit\'s max 50',
      },
      LIMIT_NUMBER: {
        error: 'LimitNotNumber',
        message: 'Limit must be number',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
    CREATE: {
      NAME_REQUIRED: {
        error: 'NameMissing',
        message: 'Name\'s required',
      },
      FIELD_EMPTY: {
        error: 'FieldEmpty',
        message: '',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
    REVIEWS: {
      SPORTSBOOKSID_REQUIRED: {
        error: 'SportsbookIDMissing',
        message: 'SportsbookID\'s missing',
      },
      SPORTSBOOKSID_INVALID: {
        error: 'SportsbookIDInvalid',
        message: 'SportsbookId\'s invalid',
      },
      LIMIT_MIN: {
        error: 'LimitMin',
        message: 'Limit\'s minimum 1',
      },
      LIMIT_MAX: {
        error: 'LimitMax',
        message: 'Limit\'s max 50',
      },
      LIMIT_NUMBER: {
        error: 'LimitNotNumber',
        message: 'Limit must be number',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
    CREATE_REVIEW: {
      SCORE_REQUIRED: {
        error: 'ScoreMissing',
        message: 'Score\'s missing',
      },
      SPORTSBOOKID_REQUIRED: {
        error: 'SportsbookIdMissing',
        message: 'SportsbookId\'s missing',
      },
      FIELD_EMPTY: {
        error: 'FieldEmpty',
        message: '',
      },
      OBJECTID_INVALID: {
        error: 'SportsbookIDInvalid',
        message: 'SportsbookId\'s invalid',
      },
      SCORE_NUMBER: {
        error: 'ScoreNotNumber',
        message: 'Score number\'s not a number',
      },
      SCORE_MIN: {
        error: 'ScoreMin',
        message: 'Score\'s minimum value is 0',
      },
      SCORE_MAX: {
        error: 'ScoreMax',
        message: 'Score\'s maximum value is 10',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
  },
};
