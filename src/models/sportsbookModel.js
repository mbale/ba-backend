import {
  Model,
  ObjectId,
} from 'mongorito';

class Sportsbook extends Model {
  static collection() {
    return 'sportsbooks';
  }

  static configure() {
  }
}

export default Sportsbook;
