import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mailgun from 'mailgun-js';
import * as contentful from 'contentful';

dotenv.config();

// global // move to prestart
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class Utils {
  /*
    Refactor default joi error object to make it better on response
  */
  static refactJoiError(joiError) {
    const {
      output,
    } = joiError;

    // strip fields
    delete output.payload;
    delete output.headers;

    return function constructError(error, message, statusCode = 400) {
      output.error = error;
      output.message = message;
      output.statusCode = statusCode;

      return output;
    };
  }

  /*
    Stream content to cloudinary
  */
  static streamToCloudinary(fromStream, options) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(resource => resolve(resource), options);
      fromStream.pipe(stream);
      fromStream.on('error', error => reject(error));
    });
  }

  /*
    Delete content from cloudinary
  */
  static async deleteContentFromCloudinary(publicId, options) {
    await cloudinary.uploader.destroy(publicId, options);
  }

  /*
    Get public url based on content's public_id
  */
  static getCloudinaryURL(publicId) {
    return cloudinary.utils.url(publicId);
  }

  /*
    Verify & decode a JWT token
  */
  static decodeJWTToken(token, options = {}) {
    try {
      const key = process.env.JWT_KEY;
      const decodedToken = jwt.verify(token, key, options);
      return decodedToken;
    } catch (error) {
      throw error;
    }
  }

  /*
    Encode and sign a token with default settings
  */
  static encodeJWTToken(data, options = {}) {
    try {
      const key = process.env.JWT_KEY;
      const opt = options;

      opt.expiresIn = process.env.JWT_DURATION;

      const recoveryToken = jwt.sign(data, key, opt);
      return recoveryToken;
    } catch (error) {
      throw error;
    }
  }

  /*
    Send email through mailgun
  */
  static async sendMail(email) {
    try {
      const client = mailgun({
        domain: process.env.MAILGUN_DOMAIN,
        apiKey: process.env.MAILGUN_API_KEY,
      });

      await client.messages().send(email);
    } catch (error) {
      throw error;
    }
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
