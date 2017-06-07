import AppError from '~/models/errors/appError.js';

class InvalidUserIdError extends AppError {
  constructor(userId = null) {
    super('UserId\'s not valid');

    this.userId = userId;
  }
}

export default InvalidUserIdError;
