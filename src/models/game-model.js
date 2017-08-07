import {
  Model,
} from 'mongorito';

class Game extends Model {
  static collection() {
    return 'games';
  }
}

function extend() {
  return Game;
}

export default extend();
