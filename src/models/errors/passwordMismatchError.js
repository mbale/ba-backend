import AppError from '~/models/errors/appError.js';

class PasswordMismatchError extends AppError {
  constructor(username = null, password = null) {
    super('Password\'s not matched with user');

    this.username = username;
    this.password = password;
  }
}

export default PasswordMismatchError;
