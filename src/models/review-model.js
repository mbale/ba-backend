import {
  Model,
  ActionTypes,
} from 'mongorito';
import server from '~/index.js';

class Review extends Model {
  static collection() {
    return 'reviews';
  }
}

const initDefaultFields = () => ({ model }) => next => async (action) => {
  try {
    const {
      fields,
      type,
    } = action;

    if (type === ActionTypes.CREATE) {
      server.log(['info'], 'Setting newly created review\'s default fields');

      if (typeof fields.text === 'undefined') {
        fields.text = false;
        model.set('text', false);
      }
    }
    return next(action);
  } catch (error) {
    throw error;
  }
};

function extendReview() {
  Review.use(initDefaultFields);

  return Review;
}

export default extendReview();
