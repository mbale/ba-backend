import {
  ActionTypes,
} from 'mongorito';
import server from '~/index.js';
import bcrypt from 'bcrypt';

const hashPassword = () => {
  return ({ getState, dispatch, model, modelClass }) => next => async (action) => {
    const { fields } = action;

    if (action.type === ActionTypes.CREATE) {
      if (fields.password !== '') {
        server.log(['info'], 'Hashing newly created user\'s password');
        const hashedPassword = await bcrypt.hash(fields.password, 10);

        fields.password = hashedPassword;
        model.set('password', hashedPassword);
      }
    }
    return next(action);
  };
};

export default {
  hashPassword,
};
