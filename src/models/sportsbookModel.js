import {
  Model,
  ObjectId,
} from 'mongorito';

class Sportsbook extends Model {
  static collection() {
    return 'sportsbooks';
  }
}

export default Sportsbook;
