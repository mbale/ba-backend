import AppError from '../errors/app-error.js';

class SteamIdTakenError extends AppError {
  constructor(steamId = null) {
    super('SteamId\'s taken');

    this.steamId = steamId;
  }
}

export default SteamIdTakenError;
