import {
  Model,
  ObjectId,
} from 'mongorito';
import server from '~/index.js';
import User from '~/models/userModel.js';

class AccessToken extends Model {
  static collection() {
    return 'accessTokens';
  }

  configure() {
    this.before('create', 'cleanUnusedTokens');
    this.after('create', 'connectWithUser');
  }

  /*
    Instance methods
   */

  /*
    Middlewares
   */

  // when creating new accesstoken
  // we automatically add it to right user
  connectWithUser() {
    server.log(['accesstokenmodel'], 'Attaching an accesstoken to user');
    return User
      .findById(this.get('userId'))
      .then((user) => {
        user.set('accessToken', this.get('_id'));

        return user.save();
      });
  }

  /*
    Utiltiy methods
   */

  // used to clean old tokens when creating new for same user
  cleanUnusedTokens() {
    server.log(['accesstokenmodel'], 'Cleaning old accesstokens');
    return AccessToken
      .remove({
        userId: this.get('userId'),
      });
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
