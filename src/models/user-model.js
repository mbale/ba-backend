import {
  Model,
} from 'mongorito';
import UserPlugins from '~/models/plugins/user-plugins.js';

const {
  hashPassword,
  setDefaultFields,
  checkIfUserExists,
  extendUserModel,
} = UserPlugins;

class User extends Model {
  static collection() {
    return 'users';
  }
}

const injectPlugins = () => {
  // add neeeded dependencies
  User.use(extendUserModel);
  User.use(setDefaultFields);
  User.use(checkIfUserExists);
  User.use(hashPassword);

  return User;
};

export default injectPlugins();
