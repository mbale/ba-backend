import {
  Model,
  ObjectId,
} from 'mongorito';
import User from '~/models/userModel.js';

class AccessToken extends Model {
  static collection() {
    return 'accessTokens';
  }

  static configure() {
    // this.before('create', 'cleanUnusedTokens');
    // this.after('create', 'connectWithUser');
  }

  // when creating new accesstoken
  // we automatically add it to correct user
  connectWithUser() {
    return User
      .findById(this.get('userId'))
      .then((user) => {
        user.set('accessToken', this.get('_id'));
        return user.save();
      });
  }

  // used to clean old tokens when creating new for same user
  cleanUnusedTokens() {
    return AccessToken
      .revokeToken(this.get('userId'));
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
