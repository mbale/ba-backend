import AppError from '~/models/errors/appError.js';

class SportsbookNotFoundByIdError extends AppError {
  constructor(sportsbookId = null) {
    super('Sportsbook with such Id\'s not found');

    this.sportsbookId = sportsbookId;
  }
}

export default SportsbookNotFoundByIdError;
