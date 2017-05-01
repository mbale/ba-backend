import userMigration from '~/models/migration/userMigration.js';
import server from '~/index.js';
import {
  Model,
} from 'mongorito';
import bcrypt from 'bcrypt';
import Promise from 'bluebird';

class User extends Model {
  static collection() {
    return 'users';
  }

  configure() {
    this.before('create', 'checkIfExists');
    this.before('create', 'hashPassword');
    this.before('create', 'initDefaultSchema');
    this.before('update', 'upgradeSchema');

    // actual schema
    // increment when migration added
    this.schemaVersion = 0;
  }

  /*
    Instance methods
   */

  // To hash plain text password and save it
  changePassword() {
    server.log(['usermodel'], 'Time to hash changed password');
    return bcrypt
      .hash(this.get('password'), 10)
      .then((hash) => {
        this.set('password', hash);
        this.save();
      });
  }

  // auth user
  // TODO: move basic auth flow to here (checking pw, token generation etc)
  // basicAuthentication(passwordToCompare) {
  // }

  /*
    Middlewares
   */

  // automatically hashing plaintext password when adding new user
  hashPassword() {
    console.log('itt')
    if (this.get('password') !== '') {
      server.log(['usermodel'], 'Hashing newly created user\'s password');
      bcrypt
        .hash(this.get('password'), 10)
        .then((hash) => {
          this.set('password', hash);
          this.save();
        });
    }
  }

  // initialize default schema - setting new fields
  initDefaultSchema() {
    server.log(['usermodel'], `Initialising default schema with version: ${this.schemaVersion}`);
    this.set('_version', this.schemaVersion);
    userMigration.default.apply(this);
  }

  // upgrade model's data schemaversion when it's older then actual
  upgradeSchema() {
    server.log(['usermodel'], 'Periodically check actual schemaversion');
    if (this.get('_version') !== this.schemaVersion) {
      // call migration until we've correct ver.
      while (this.get('_version') !== this.schemaVersion) {
        const ver = (this.get('_version') + 1).toString();

        userMigration[ver].apply(this);
        this.set('_version', this.get('_version') + 1);
      }
    }
  }

  // check if there's already registered user with such email/username
  checkIfExists() {
    server.log(['usermodel'], 'Check for possible duplications before adding new user');
    const query = [];

    // if he submitted email with signup
    if (this.get('email') && this.get('email') !== '') {
      query.push({
        email: this.get('email'),
      });
    }

    // if he submitted username too
    if (this.get('username') && this.get('username') !== '') {
      query.push({
        username: this.get('username'),
      });
    }

    // and check for steamid, too
    if (this.get('steamProvider') && this.get('steamProvider').length !== 0) {
      query.push({
        'steamProvider.steamid': this.get('steamProvider.steamid'),
      });
    }

    const duplicateHandler = (user) => {
      if (user) {
        // duplicate -> find which field
        if (user.get('email') === this.get('email')) {
          return Promise.reject({
            code: 0,
            data: user.get('email'),
          });
        }

        if (user.get('username') === this.get('username')) {
          return Promise.reject({
            code: 1,
            data: user.get('username'),
          });
        }

        return Promise.reject({
          code: 2,
          data: user.get('steamProvider.steamid'),
        });
      }
      return Promise.resolve();
    };

    return User
      .or(query)
      .findOne()
      .then(duplicateHandler);
  }

  /*
    Utility methods
   */
  static comparePassword(plain, hash) {
    server.log(['usermodel'], 'Comparing user\'s password');
    return bcrypt.compare(plain, hash);
  }
}

export default User;
