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
  }

  schemaValidation(next) {
    return next;
  }
}

export default AccessToken;
