import AppError from '../errors/app-error.js';

class EntityNotFoundError extends AppError {
  constructor(entity = null, prop = null, value = null) {
    super(`${entity}'s not found with "${prop}" ${value}`);

    this.entity = entity;
    this.prop = entity;
    this.value = value;
  }
}

export default EntityNotFoundError;
