import AppError from '../errors/app-error.js';

class EntityTakenError extends AppError {
  constructor(entity = null, prop = null, value = null) {
    super(`${entity}'s already taken with "${prop}" ${value}`);

    this.entity = entity;
    this.prop = entity;
    this.value = value;
  }
}

export default EntityTakenError;
