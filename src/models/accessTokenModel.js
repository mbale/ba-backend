import {
  Model,
  ObjectId,
} from 'mongorito';

class AccessToken extends Model {
  collection() {
    return 'accessTokens';
  }

  configure() {
    this.before('create', 'cleanUnusedTokens');
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
