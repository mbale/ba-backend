import {
  Model,
  ObjectId,
} from 'mongorito';
import UserModel from '~/models/userModel.js';

class AccessToken extends Model {
  collection() {
    return 'accessTokens';
  }

  configure() {
    this.before('create', 'cleanUnusedTokens');
    this.after('create', 'connectWithUser');
  }

  // when creating new accesstoken
  // we automatically add it to correct user
  connectWithUser(next) {
    return UserModel
      .findById(this.get('userId'))
      .then((user) => {
        user.set('accessToken', this.get('_id'));
        return user.save();
      })
      .then(() => next);
  }

  // used to clean old tokens when creating new for same user
  cleanUnusedTokens(next) {
    return AccessToken
      .revokeToken(this.get('userId'))
      .then(() => next);
  }

  // remove token from collection
  static revokeToken(userId) {
    return AccessToken
      .remove({
        userId: new ObjectId(userId),
      });
      // TODO remove from user.get('accessToken') too
  }
}

export default AccessToken;
