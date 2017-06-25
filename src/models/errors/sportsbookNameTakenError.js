import AppError from '~/models/errors/appError.js';

class SportsbookNameTakenError extends AppError {
  constructor(name = null) {
    super('Sportsbook name\'s taken');

    this.name = name;
  }
}

export default SportsbookNameTakenError;
