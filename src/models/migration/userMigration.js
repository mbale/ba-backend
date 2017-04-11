import server from '~/index.js';

/*
  Each migration guide point refers as migration logics to actual (line by line) schemaversion
  default() => refers to default (actual) schema version
  1() => runs when schemaVersion's 1
  ..etc
  IMPORTANT
  Migration points run on update hook
  Default runs on create hook
  So when making new schemaversions in migration point,
  you've to include schema changes in default as well
*/

const UserMigration = {
  default() {
    server.log(['database'], `Initiating user's schema with version: ${this.get('_version')}`);
    this.set('accessToken', '');
    this.set('socialProviders', []);
    this.set('recoveryHash', '');
  },
  1() {
    server.log(['database'], `Upgrading user's schema version: ${this.get('_version')} to 1.`);
  },
  2() {
    server.log(['database'], `Upgrading user's schema version: ${this.get('_version')} to 2.`);
  },
  3() {
    server.log(['database'], `Upgrading user's schema version: ${this.get('_version')} to 3.`);
  },
  // another migration point etc
};

export default UserMigration;
