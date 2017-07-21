import AppError from '~/errors/app-error.js';

class PasswordMismatchError extends AppError {
  constructor(username = null, password = null) {
    super('Incorrect password');

    this.username = username;
    this.password = password;
  }
}

export default PasswordMismatchError;
