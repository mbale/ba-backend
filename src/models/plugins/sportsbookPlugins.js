import {
  ActionTypes,
} from 'mongorito';
import server from '~/index.js';
import SportsbookNameTakenError from '~/models/errors/sportsbookNameTakenError.js';

const setDefaultFields = () => {
  return ({ model }) => next => async (action) => {
    const { fields } = action;

    if (action.type === ActionTypes.CREATE) {
      server.log(['info'], 'Setting newly created user\'s default fields');

      /*
      fieldset
       */
      if (typeof fields.accessToken === 'undefined') {
        fields.accessToken = false;
        model.set('accessToken', false);
      }

      if (typeof fields.recoveryToken === 'undefined') {
        fields.recoveryToken = false;
        model.set('recoveryToken', false);
      }

      if (typeof fields.avatar === 'undefined') {
        fields.avatar = false;
        model.set('avatar', false);
      }

      if (typeof fields.reviews === 'undefined') {
        fields.reviews = [];
        model.set('reviews', []);
      }

      if (typeof fields.steamProvider === 'undefined') {
        fields.steamProvider = {};
        model.set('steamProvider', {});
      }
    }
    return next(action);
  };
};

const checkIfSportsbookExists = () => {
  return ({ getState, dispatch, model, modelClass }) => next => async (action) => {
    if (action.type === ActionTypes.CREATE) {
      server.log(['info'], 'Check for possible duplications before adding new sportsbook');
      const {
        fields: {
          name,
        },
      } = action;

      try {
        const sportsbook = await modelClass.findOne({
          name,
        });

        if (sportsbook) {
          throw new SportsbookNameTakenError(name);
        }
      } catch (error) {
        throw error;
      }
    }
    return next(action);
  };
};

export default {
  checkIfSportsbookExists,
};
