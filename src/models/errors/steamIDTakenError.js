import AppError from '~/models/errors/appError.js';

class SteamIDTakenError extends AppError {
  constructor(steamID = null) {
    super('SteamID\'s taken');

    this.steamID = steamID;
  }
}

export default SteamIDTakenError;
