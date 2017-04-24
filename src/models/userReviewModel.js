import {
  Model,
  ObjectId,
} from 'mongorito';

class UserReview extends Model {
  static collection() {
    return 'userReviews';
  }

  static configure() {
  }
}

export default UserReview;
