import { ValidationError } from 'joi';
import * as cloudinary from 'cloudinary';
import * as dotenv from 'dotenv';
import * as mailgun from 'mailgun-js';
import * as contentful from 'contentful';
import { SignOptions, sign, verify } from 'jsonwebtoken';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { SteamProvider } from './entity/user';
import { Stream } from 'stream';

dotenv.config();

// global // move to prestart
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const JWT_KEY = process.env.BACKEND_JWT_KEY;
const JWT_DURATION = process.env.BACKEND_JWT_DURATION;
const MAILGUN_DOMAIN = process.env.BACKEND_MAILGUN_DOMAIN;
const MAILGUN_API_KEY = process.env.BACKEND_MAILGUN_API_KEY;

/**
 * Email declaration
 * 
 * @interface Email
 */
interface Email {
  from : string;
  to : string;
  subject : string;
  html : string;
}

interface Output {
  error : string;
  message : string;
  statusCode : number;
}

interface CloudinaryResponse {
  public_id : string;
  version : number;
  signature : string;
  width : number;
  height : number;
  format : string;
  resource_type : string;
  created_at : Date;
  tags : string[];
  bytes : number;
  type : string;
  etag : string;
  placeholder : boolean;
  url : string;
  secure_url : string;
  original_filename : string;
}

/**
 * Generates a JWT encoded token
 * 
 * @export
 * @param {object} [data={}] 
 * @param {SignOptions} [options={}] 
 * @returns {string} 
 */
export function encodeJWTToken(data : object = {}, options : SignOptions = {}) : string {
  options.expiresIn = JWT_DURATION;

  const recoveryToken = sign({}, JWT_KEY, options);
  return recoveryToken;
}

/**
 * Get public URL for cloudinary content by ID
 * 
 * @export
 * @param {string} publicId 
 * @returns {string} 
 */
export function getCloudinaryURL(publicId : string) : string {
  return cloudinary.utils.url(publicId);
}

/**
 * Mailgun Wrapper to send email
 * 
 * @export
 * @param {Email} email 
 * @returns {Promise<JSON>} 
 */
export async function sendMail(email : Email) : Promise<JSON> {
  const client = mailgun({
    domain: MAILGUN_DOMAIN,
    apiKey: MAILGUN_API_KEY,
  });

  return client.messages().send(email);
}

/**
 * Query steam API to get users data
 * 
 * @export
 * @param {string} steamId 
 * @param {string} steamApiKey 
 * @returns {Promise<SteamProvider>} 
 */
export async function tryQuerySteamData(steamId : string, steamApiKey : string)
  : Promise<SteamProvider> {
  const steamAPIBaseURL = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/';
  const {
    data: {
      response: {
        players,
      },
    },
  } = await axios.get(steamAPIBaseURL, {
    params: {
      key: steamApiKey,
      steamids: steamId,
    },
  });

  // steam doesn't send it camelCase way
  // but we store it that way
  const steamProvider : SteamProvider = {
    steamId: players[0].steamid,
    communityVisibilityState: players[0].communityvisibilitystate,
    profileState: players[0].profilestate,
    personaname: players[0].personaname,
    lastLogoff: players[0].lastlogoff,
    profileURL: players[0].profileurl,
    avatar: {
      default: players[0].avatar,
      medium: players[0].avatarmedium,
      high: players[0].avatarfull,
    },
    personaState: players[0].personastate,
    primaryClanId: players[0].primaryclanid,
    timeCreated: players[0].timecreated,
    personaStateFlags: players[0].personastateflags,
    iocCountryCode: players[0].loccountrycode,
    iocStateCode: players[0].locstatecode,
    iocCityId: players[0].loccityid,
  };
  return steamProvider;
}

/**
 * Upload image to Cloudinary from url or file
 * 
 * @export
 * @param {string} file 
 * @param {object} options 
 * @returns {Promise<CloudinaryResponse>} 
 */
export async function uploadToCloudinary(file : string, options : object) 
: Promise<CloudinaryResponse> {
  return await cloudinary.v2.uploader.upload(file, options);
}

/**
 * Get public URL for public id
 * 
 * @export
 * @param {string} publicId 
 * @returns {string} 
 */
export function getCloudinaryPublicURL(publicId : string) : string {
  return cloudinary.utils.url(publicId);
}

/**
 * Stream to cloudinary
 * 
 * @export
 * @param {Stream} fromStream 
 * @param {Object} options 
 * @returns {Promise<CloudinaryResponse>} 
 */
export async function streamToCloudinary(fromStream : Stream, options : Object) 
: Promise<CloudinaryResponse> {
  return new Promise<CloudinaryResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(resource => resolve(resource), options);
    fromStream.pipe(stream);
    fromStream.on('error', error => reject(error));
  });
}

/**
 * Reconstruct joi distributed error object
 * 
 * @export
 * @param {*} parserError 
 * @returns 
 */
export function refactJoiError(parserError : any) {
  
  const {
    output,
  } = parserError;

  // strip fields
  delete output.payload;
  delete output.headers;

  return function (error : string, message : string, statusCode : number = 400) : Output {
    return {
      error,
      statusCode,
      message,
    };
  };
}

class Utils {

  /*
    Delete content from cloudinary
  */
  static async deleteContentFromCloudinary(publicId, options) {
    await cloudinary.uploader.destroy(publicId, options);
  }

  /*
    Get contentful client
  */
  static async getContentfulClient() {
    try {
      const client = contentful.createClient({
        space: process.env.CONTENTFUL_SPACE_ID,
        accessToken: process.env.CONTENTFUL_DELIVERY_ACCESS_TOKEN,
      });
      return client;
    } catch (error) {
      throw error;
    }
  }
}

export default Utils;
