import {
  Model,
} from 'mongorito';

class UserReview extends Model {
  static collection() {
    return 'userReviews';
  }

  configure() {
  }
}

export default UserReview;
