import ExtendoError from 'extendo-error';

/**
 * If entity's not found by key
 *
 * @export
 * @class EntityNotFoundError
 * @extends {ExtendoError}
 */
export class EntityNotFoundError extends ExtendoError {
  public entity : string = null;
  public prop : string = null;
  public value : string = null;

  /**
   * Creates an instance of EntityNotFoundError.
   * @param {string} entity
   * @param {string} prop
   * @param {string} value
   * @memberof EntityNotFoundError
   */
  constructor(entity : string, prop : string, value : string) {
    super(`${entity}'s not found with "${prop}" ${value}`);

    this.entity = entity;
    this.prop = prop;
    this.value = value;
  }
}

/**
 * When an entity which we work with becomes invalid state
 *
 * @export
 * @class EntityInvalidError
 * @extends {ExtendoError}
 */
export class EntityInvalidError extends ExtendoError {
  public entity: string = null;
  public prop: string = null;
  public reason: string = null;

  constructor(entity: string, prop: string, reason: string) {
    super(`${entity} is invalid with "${prop}". ${reason}`);

    this.entity = entity;
    this.prop = prop;
    this.reason = reason;
  }
}

/**
 * If steamId fails through check on steam API
 *
 * @export
 * @class InvalidSteamId
 * @extends {ExtendoError}
 */
export class InvalidSteamIdError extends ExtendoError {
  public steamId : string = null;

  /**
   * Creates an instance of InvalidSteamId.
   * @param {string} steamId
   * @memberof InvalidSteamId
   */
  constructor(steamId : string) {
    super(`Invalid steamId as: ${steamId}`);
    this.steamId;
  }
}

/**
 * If entity's is taken by key
 *
 * @export
 * @class EntityTakenError
 * @extends {ExtendoError}
 */
export class EntityTakenError extends ExtendoError {
  public entity : string = null;
  public prop : string = null;
  public value : string = null;

  /**
   * Creates an instance of EntityTakenError.
   * @param {string} entityName
   * @param {string} prop
   * @param {string} value
   * @memberof EntityTakenError
   */
  constructor(entityName : string, prop : string, value : string) {
    super(`We already have ${entityName}'s with "${prop}" ${value}`);
    this.entity = entityName;
    this.prop = prop;
    this.value = value;
  }
}

/**
 * If authentication fails due to wrong credentials
 *
 * @export
 * @class PasswordMismatchError
 * @extends {ExtendoError}
 */
export class PasswordMismatchError extends ExtendoError {
  public username : string = null;
  public password : string = null;

  /**
   * Creates an instance of PasswordMismatchError.
   * @param {string} username
   * @param {string} password
   * @memberof PasswordMismatchError
   */
  constructor(username : string, password : string) {
    super(`Incorrect password for ${username} as ${password}`);

    this.username = username;
    this.password = password;
  }
}

/**
 * If connection to microservice is not available
 *
 * @export
 * @class MicroserviceError
 * @extends {ExtendoError}
 */
export class MicroserviceError extends ExtendoError {
  public serviceName: string = null;
  public serviceURL: string = null;

  /**
   * Creates an instance of MicroserviceError.
   * @param {string} serviceName
   * @param {string} serviceURL
   * @memberof MicroserviceError
   */
  constructor(serviceName: string, serviceURL: string) {
    super(`${serviceName} is not available at ${serviceURL}`);

    this.serviceName = serviceName;
    this.serviceURL = serviceURL;
  }
}
