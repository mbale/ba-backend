import {
  Model,
} from 'mongorito';

class UserReview extends Model {
  static collection() {
    return 'reviews';
  }

  static configure() {
  }
}

export default UserReview;
