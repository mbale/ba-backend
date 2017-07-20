import AppError from '~/errors/appError.js';

class SportsbookAlreadyReviewedError extends AppError {
  constructor(sportsbookId = null) {
    super('Sportsbook\'s already reviewed');

    this.sportsbookId = sportsbookId;
  }
}

export default SportsbookAlreadyReviewedError;
