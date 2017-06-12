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
    TEST_RECOVERYTOKEN: {
      TOKEN_REQUIRED: {
        error: 'RecoveryTokenMissing',
        message: 'Recovery token\'s missing',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
    RECOVER_ACCOUNT: {
      TOKEN_REQUIRED: {
        error: 'RecoveryTokenMissing',
        message: 'Recovery token\'s missing',
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
      RATE_REQUIRED: {
        error: 'RateMissing',
        message: 'Rate\'s missing',
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
      RATE_NUMBER: {
        error: 'RateNotNumber',
        message: 'Rate\'s not a number',
      },
      RATE_MIN: {
        error: 'RateMin',
        message: 'Rate\'s minimum value is 0',
      },
      RATE_MAX: {
        error: 'RateMax',
        message: 'Rate\'s maximum value is 5',
      },
      UNDEFINED: {
        error: 'UndefinedError',
        message: 'You should feel bad',
      },
    },
  },
};
