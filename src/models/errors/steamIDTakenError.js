import AppError from '~/models/errors/appError.js';

class SteamIdTakenError extends AppError {
  constructor(steamId = null) {
    super('SteamId\'s taken');

    this.steamId = steamId;
  }
}

export default SteamIdTakenError;
