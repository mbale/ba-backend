import AppError from '~/models/errors/appError.js';

class UsernameNotFoundError extends AppError {
  constructor(username = null) {
    super('There\'s no user with this username');

    this.username = username;
  }
}

export default UsernameNotFoundError;
