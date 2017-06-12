import {
  Model,
} from 'mongorito';

class Review extends Model {
  static collection() {
    return 'reviews';
  }
}

export default Review;
