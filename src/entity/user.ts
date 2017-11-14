import * as dotenv from 'dotenv';
import * as nanoid from 'nanoid';
import Prediction from './prediction';
import {
  Entity,
  ObjectIdColumn,
  Column,
  ObjectID,
  BeforeUpdate,
  BeforeInsert,
  Index,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { encodeJWTToken, sendMail, getCloudinaryURL, tryQuerySteamData } from '../utils';
import { resetPasswordTemplate } from '../templates';

dotenv.config();

/*
  Environment variables
*/

const SITE_URL = process.env.BACKEND_SITE_URL;
const RECOVER_EMAIL_ACCOUNT = process.env.BACKEND_FROM_RECOVER_ACCOUNT;
const RECOVER_SUBJECT = process.env.BACKEND_SUBJECT_RECOVER_ACCOUNT;
const STEAM_API_KEY = process.env.BACKEND_STEAM_API_KEY;

/*
  Interfaces
*/

export interface Profile {
  /* public */
  id : ObjectID;
  username: string;
  countryCode : string;
  registeredOn : Date;
  avatar : string;
  /* private */
  email? : string;
}

export interface SteamProvider {
  steamId : string;
  communityVisibilityState : number;
  profileState: number;
  personaname : string;
  lastLogoff : number;
  profileURL : string;
  avatar : {
    default : string;
    medium : string;
    high : string;
  };
  personaState : number;
  primaryClanId : number;
  timeCreated : number;
  personaStateFlags : number;
  iocCountryCode : string;
  iocStateCode : number;
  iocCityId : number;
  //
}

/*
  Entity
*/

@Entity('users')
class User {
  @ObjectIdColumn()
  _id : ObjectID;

  @Column()
  @Index({
    unique: true,
  })
  username : string;

  @Column()
  displayname : string = this.username || '';

  @Column()
  password : string = '';

  @Column()
  accessToken : string = '';

  @Column()
  recoveryToken : string = '';

  @Column()
  avatar : string = '';

  @Column()
  email : string = '';

  @Column()
  reviews : ObjectID[] = [];

  @Column()
  steamProvider : object | SteamProvider = {};

  @Column()
  countryCode : string = '';

  @Column()
  _createdAt : Date = new Date();

  @Column()
  _updatedAt : Date = new Date();

  /*
    Hooks
  */

  @BeforeInsert()
  // username is storing login as unique key
  // displayname is for customisation
  // during signup we save this way
  nameCasing() {
    this.username = this.username.toLowerCase();
    this.displayname = this.username;
  }

  @BeforeInsert()
  updateCreationDate() {
    this._createdAt = new Date();
  }  

  @BeforeUpdate()
  updateModificationDate() {
    this._updatedAt = new Date();
  }

  /**
   * Compare user's password with another credential.
   * 
   * @param {string} passwordToCheck 
   * @returns {Promise<boolean>} 
   * @memberof User
   */
  async comparePassword(passwordToCheck : string) : Promise<boolean> {
    const {
      username,
      password,
    } = this;

    // check if it equals
    const equals = await bcrypt.compare(passwordToCheck, password);

    if (equals) {
      return true;
    }

    return false;
  }

  /**
   * Hash the current password
   * 
   * @returns {Promise<void>} 
   * @memberof User
   */
  async hashPassword() : Promise<void> {
    const password = this.password;
    const hashedPassword = await bcrypt.hash(password, 10);
    this.password = hashedPassword;
  }

  /**
   * Handles JWT token generation and setup on user.
   * Returns the token
   * 
   * @returns {string} 
   * @memberof User
   */
  authorizeAccess() : string {
    const accessToken = encodeJWTToken();

    // setting prop
    this.accessToken = accessToken;

    return accessToken;
  }

  /**
   * Ungrant accesstoken for user
   * 
   * @memberof User
   */
  revokeTokenAccess() : void {
    this.accessToken = '';
  }

  /**
   * Similar as @revokeTokenAccess but removes password as well
   * 
   * @memberof User
   */
  revokeCompleteAccess() : void {
    this.revokeTokenAccess();
    this.password = '';
  }

  /**
   * Set up account recovery process
   * 
   * @returns {Promise<void>} 
   * @memberof User
   */
  async resetPassword() : Promise<void> {
    const {
      _id,
      email,
      username,
    } = this;

    // make recovery token
    const recoveryToken = nanoid();

    // setting prop
    this.revokeCompleteAccess();
    this.recoveryToken = recoveryToken;

    // construct URL which we send user redirect to
    const actionURL = `${SITE_URL}/reset-password/${recoveryToken}`;
    const template = resetPasswordTemplate(username, actionURL);

    const emailToSend = {
      from: RECOVER_EMAIL_ACCOUNT,
      to: email,
      subject: RECOVER_SUBJECT,
      html: template,
    };

    // emailing user
    await sendMail(emailToSend);
  }

  /**
   * Set up new password and clean things from forget process
   * 
   * @param {string} newPassword 
   * @memberof User
   */
  recoverAccount(newPassword : string) : void {
    let {
      recoveryToken,
      password,
    } = this;

    recoveryToken = '';
    password = newPassword;
  }

  /**
   * Get profile of the user
   * 
   * @param {boolean} [privateProfile=false] 
   * @returns {Profile} 
   * @memberof User
   */
  getProfile(privateProfile : boolean = false) : Profile {
    let avatarURL = '';

    if (this.avatar.length !== 0) {
      avatarURL = getCloudinaryURL(this.avatar);
    }
    const profile : Profile = {
      id : this._id,
      username: this.displayname,
      countryCode: this.countryCode,
      registeredOn : this._createdAt,
      avatar: avatarURL,
    };

    // private profile
    if (privateProfile) {
      profile.email = this.email;
    }

    return profile;
  }

  /**
   * Edit profile of user
   * 
   * @param {Profile} profile 
   * @memberof User
   */
  async editProfileDetails(profile : Profile) : Promise<void> {
    for (const [key, value] of Object.entries(profile)) {
      if (key === 'username') {
        // we store it as original (casing)
        this.displayname = value;
        // we store it as lowercase for authentication purpose
        this.username = value.toString().toLowerCase();
      } else if (key === 'password') {
        this.password = value;
        await this.hashPassword();
      } else {
        this[key] = value;
      }
    }
  }
}

export default User;
