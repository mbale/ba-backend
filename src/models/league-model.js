import {
  Model,
} from 'mongorito';

class League extends Model {
  static collection() {
    return 'leagues';
  }
}

function extend() {
  return League;
}

export default extend();
