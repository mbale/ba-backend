import AppError from '~/models/errors/appError.js';

class EmailTakenError extends AppError {
  constructor(email = null) {
    super('Email\'s taken');

    this.email = email;
  }
}

export default EmailTakenError;
