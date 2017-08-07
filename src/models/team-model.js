import {
  Model,
} from 'mongorito';

class Team extends Model {
  static collection() {
    return 'teams';
  }
}

function extend() {
  return Team;
}

export default extend();
