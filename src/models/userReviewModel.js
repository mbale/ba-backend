import {
  Model,
  ObjectId,
} from 'mongorito';

class UserReview extends Model {
  collection() {
    return 'userReviews';
  }

  configure() {
  }
}

export default UserReview;
