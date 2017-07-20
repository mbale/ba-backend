import AppError from '~/errors/appError.js';

class SportsbookNotFoundByNameError extends AppError {
  constructor(sportsbookname = null) {
    super('Sportsbook with such name\'s not found');

    this.sportsbookname = sportsbookname;
  }
}

export default SportsbookNotFoundByNameError;
