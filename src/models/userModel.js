import {
  Model,
} from 'mongorito';
import server from '~/index.js';
import bcrypt from 'bcrypt';
import Promise from 'bluebird';
import Joi from 'joi';

class User extends Model {
  collection() {
    return 'users';
  }

  configure() {
    this.before('create', 'checkIfExists');
    this.before('create', 'hashPassword');
    this.before('create', 'setDefSchemaVersion');
    this.before('update', 'upgradeSchema');

    // this.schema = Joi.object().keys({
    //   username: Joi.string().min(5).optional(),
    //   email: Joi.string().email()
    // });

    this.schemaVersion = 0;
    // set version of actual newest schema
    this.migrationGuide = {
      1() {
        server.log(['database'], `upgrading user's schema version: ${this.get('_version')} to 1.`);
      },
      2() {
        server.log(['database'], `upgrading user's schema version: ${this.get('_version')} to 2.`);
      },
      3() {
        server.log(['database'], `upgrading user's schema version: ${this.get('_version')} to 3.`);
      },
    };
  }

  hashPassword(next) {
    bcrypt.hash(this.get('password'), 10, (err, hash) => {
      this.set('password', hash);
      this.save();
      return next;
    });
  }

  // we set actual schemaversin for every new data
  setDefSchemaVersion(next) {
    this.set('_version', this.schemaVersion);

    return next;
  }

  upgradeSchema(next) {
    if (this.get('_version') !== this.schemaVersion) {
      // call migration until we've correct ver.
      while (this.get('_version') !== this.schemaVersion) {
        const ver = (this.get('_version') + 1).toString();

        this.migrationGuide[ver].apply(this);
        this.set('_version', this.get('_version') + 1);
      }
    }

    return next;
  }

  checkIfExists(next) {
    const duplicateHandler = (user) => {
      if (user) {
        // duplicate -> find which field
        if (user.get('email') === this.get('email')) {
          return Promise.reject(user.get('email'));
        }
        return Promise.reject(user.get('username'));
      }
      return next;
    };

    return User
      .or({
        email: this.get('email'),
      }, {
        username: this.get('username'),
      })
      .findOne()
      .then(duplicateHandler);
  }

  static hashPassword(password) {
    console.log(password);
  }

  static comparePassword(frompw, topw) {

  }
}

export default User;
