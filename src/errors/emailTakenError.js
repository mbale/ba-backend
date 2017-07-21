import AppError from '~/errors/app-error.js';

class EmailTakenError extends AppError {
  constructor(email = null) {
    super('Email\'s taken');

    this.email = email;
  }
}

export default EmailTakenError;
