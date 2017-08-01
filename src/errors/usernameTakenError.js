import AppError from '../errors/app-error.js';

class UsernameTakenError extends AppError {
  constructor(username = null) {
    super('Username\'s taken');

    this.username = username;
  }
}

export default UsernameTakenError;
