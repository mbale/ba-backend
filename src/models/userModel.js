import {
  Model,
} from 'mongorito';
import UserPlugins from '~/models/plugins/userPlugins.js';

const {
  hashPassword,
  setDefaultFields,
  checkIfUserExists,
  extendUser,
} = UserPlugins;

class User extends Model {
  static collection() {
    return 'users';
  }
}

const injectPlugins = () => {
  // add neeeded dependencies
  User.use(extendUser);
  User.use(setDefaultFields);
  User.use(checkIfUserExists);
  User.use(hashPassword);

  return User;
};

export default injectPlugins();
