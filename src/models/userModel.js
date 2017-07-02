import {
  Model,
} from 'mongorito';
import UserPlugins from '~/models/plugins/userPlugins.js';

const {
  hashPassword,
  setDefaultFields,
  // checkUniqueFieldsOnEdit,
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
