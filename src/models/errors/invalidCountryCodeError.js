import AppError from '~/models/errors/appError.js';

class InvalidCountryCodeError extends AppError {
  constructor(countryCode = null) {
    super('Invalid country code');

    this.countryCode = countryCode;
  }
}

export default InvalidCountryCodeError;
