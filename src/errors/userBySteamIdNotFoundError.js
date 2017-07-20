import AppError from '~/errors/appError.js';

class UserBySteamIdNotFoundError extends AppError {
  constructor(steamId = null) {
    super('User\'s not found by such steamId ');

    this.steamId = steamId;
  }
}

export default UserBySteamIdNotFoundError;
