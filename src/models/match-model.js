import {
  Model,
} from 'mongorito';

class Match extends Model {
  static collection() {
    return 'matches';
  }
}

function extend() {
  return Match;
}

export default extend();
