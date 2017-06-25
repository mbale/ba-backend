import {
  Model,
} from 'mongorito';
import SportsbookPlugins from '~/models/plugins/sportsbookPlugins.js';

const {
  checkIfSportsbookExists,
} = SportsbookPlugins;

class Sportsbook extends Model {
  static collection() {
    return 'sportsbooks';
  }
}

const injectPlugins = () => {
  // add neeeded dependencies
  Sportsbook.use(checkIfSportsbookExists);

  return Sportsbook;
};

export default injectPlugins();
