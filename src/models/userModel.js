import userMigration from '~/models/migration/userMigration.js';
import {
  Model,
} from 'mongorito';
import bcrypt from 'bcrypt';
import Promise from 'bluebird';

class User extends Model {
  collection() {
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

  // automatically hashing password field when adding new item to collection
  // (e.g: creating new user)
  hashPassword(next) {
    bcrypt.hash(this.get('password'), 10, (err, hash) => {
      this.set('password', hash);
      this.save();

      return next;
    });
  }

  // we initiate default (actual) schema
  initDefaultSchema(next) {
    this.set('_version', this.schemaVersion);
    userMigration.default.apply(this);

    return next;
  }

  upgradeSchema(next) {
    if (this.get('_version') !== this.schemaVersion) {
      // call migration until we've correct ver.
      while (this.get('_version') !== this.schemaVersion) {
        const ver = (this.get('_version') + 1).toString();

        userMigration[ver].apply(this);
        this.set('_version', this.get('_version') + 1);
      }
    }

    return next;
  }

  // check if there's already registered user with such email/username
  checkIfExists(next) {
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
            email: user.get('email'),
          });
        }
        return Promise.reject({
          username: user.get('username'),
        });
      }
      return next;
    };

    return User
      .or(query)
      .findOne()
      .then(duplicateHandler);
  }

  // TODO: implement hashing instead of in middleware
  // static hashPassword(password) {
  //   console.log(password);
  // }

  static comparePassword(frompw, topw) {
    return bcrypt.compare(frompw, topw);
  }
}

export default User;
