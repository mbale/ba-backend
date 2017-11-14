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
    super(`${entityName}'s already taken with "${prop}" ${value}`);
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
  public username : string  = null;
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
