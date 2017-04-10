import {
  Model,
} from 'mongorito';
import Joi from 'joi';

class AccessToken extends Model {
  collection() {
    return 'accessTokens';
  }

  configure() {
    // sch
    this.schema = Joi.object().keys({

    });

    this.before('create', 'schemaValidation');
    this.before('create', 'cleanUnusedTokens')
  }

  schemaValidation(next) {
    return next;
  }

  cleanUnusedTokens(next) {
    return AccessToken
      .remove({
        userId: this.get('userId'),
      })
      .then((arr) => console.log(arr))
      .catch((er) => console.log(er));
  }
}

export default AccessToken;
