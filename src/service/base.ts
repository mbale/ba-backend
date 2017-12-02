import axios, { AxiosAdapter, AxiosInstance } from 'axios';
import * as qs from 'qs';
import * as dotenv from 'dotenv';

dotenv.config();

const TEAM_SERVICE_URL = process.env.TEAM_SERVICE_URL;

/**
 * Containing data of service pinging
 * 
 * @interface PingResult
 */
interface PingResult {
  running: boolean;
  baseURL: string;
  data?: Error;
}

/**
 * Default base class for each service communicator
 * 
 * @abstract
 * @class BaseService
 */
abstract class BaseService {
  /**
   * Contains root URL of service
   * 
   * @static
   * @memberof BaseService
   */
  public static serviceBaseURL : string = '';
  public static axiosInstance : AxiosInstance = null;

  /**
   * Initialize the core service with bootstrapped values
   * Needs to be called
   * 
   * @static
   * @param {string} serviceBaseURL 
   * @returns 
   * @memberof BaseService
   */
  public static initialize(serviceBaseURL : string) {
    this.serviceBaseURL = serviceBaseURL;
    this.axiosInstance = axios.create({
      paramsSerializer(param) {
        // by default axios convert same query params into array in URL e.g. ids=[] 
        return qs.stringify(param, { indices: false });
      },
      baseURL: `${serviceBaseURL}`,
    });
  }

  /**
   * Checks if service's healthy
   * 
   * @static
   * @returns {Promise<boolean>} 
   * @memberof BaseService
   */
  public static async ping() : Promise<PingResult> {
    try {
      const request = await this.axiosInstance.get(`${this.serviceBaseURL}`);
    } catch (e) {
      return {
        running: false,
        baseURL: this.serviceBaseURL,
        data: e,
      };
    }
    return {
      running: true,
      baseURL: this.serviceBaseURL,
      data: null,
    };
  }
}

export default BaseService;
