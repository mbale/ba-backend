import AppError from '../errors/app-error.js';

class StakeNotInRangeError extends AppError {
  constructor(stake = null, odds = null) {
    super(`Stake "${stake}" is disallowed with odds "${odds}"`);

    this.stake = stake;
    this.odds = odds;
  }
}

export default StakeNotInRangeError;
