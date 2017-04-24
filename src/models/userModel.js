import userMigration from '~/models/migration/userMigration.js';
import Mongorito from 'mongorito';
import bcrypt from 'bcrypt';
import Promise from 'bluebird';

class User extends Mongorito.Model {
  static collection() {
    return 'users';
  }

  configure() {
    this.before('create', 'checkIfExists');
    this.before('create', 'hashPassword');
    this.before('create', 'initDefaultSchema');
    this.before('update', 'upgradeSchema');
    this.before('update', 'hashChangedPassword');

    // actual schema
    // increment when migration added
    this.schemaVersion = 0;
  }

  hashChangedPassword() {
    if (this.changed('password')) {
      return bcrypt
        .hash(this.get('password'), 10)
        .then((hash) => {
          this.set('password', hash);
        });
    }
    return Promise.resolve();
  }

  // automatically hashing password field when adding new item to collection
  // (e.g: creating new user)
  hashPassword() {
    bcrypt
      .hash(this.get('password'), 10)
      .then((hash) => {
        this.set('password', hash);
        this.save();
      });
  }

  // we initiate default (actual) schema
  initDefaultSchema() {
    this.set('_version', this.schemaVersion);
    userMigration.default.apply(this);
  }

  upgradeSchema() {
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
    const query = [];

    if (this.get('email') && this.get('email') !== '') {
      query.push({
        email: this.get('email'),
      });
    }

    if (this.get('username') && this.get('username') !== '') {
      query.push({
        username: this.get('username'),
      });
    }

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

  static comparePassword(frompw, topw) {
    return bcrypt.compare(frompw, topw);
  }
}

export default User;
