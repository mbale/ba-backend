import {
  Model,
  ObjectId,
} from 'mongorito';

class Sportsbook extends Model {
  collection() {
    return 'sportsbooks';
  }

  configure() {
  }
}

export default Sportsbook;
