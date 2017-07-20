class AppError extends Error {
  constructor(message) {
    // error constructor call.
    super(message);

    // stacktrace saving
    Error.captureStackTrace(this, this.constructor);

    // just in case we save name of class too
    this.name = this.constructor.name;
  }
}

export default AppError;
