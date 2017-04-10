import {
  Model,
} from 'mongorito';

class AccessToken extends Model {
  collection() {
    return 'accessTokens';
  }

  configure() {
    this.before('create', 'cleanUnusedTokens');
  }

  schemaValidation(next) {
    return next;
  }

  cleanUnusedTokens(next) {
    return AccessToken
      .remove({
        userId: this.get('userId'),
      })
      .then(() => next);
  }
}

export default AccessToken;
