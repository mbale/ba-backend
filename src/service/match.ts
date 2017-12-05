import * as dotenv from 'dotenv';
import axios from 'axios';
import { ObjectID } from 'typeorm';
import BaseService from './base';
import { Match, League, HTTPService, GetMatchesQueryParams } from 'ba-common';
import { MicroserviceError } from '../errors';
import { AxiosError } from 'ba-common/node_modules/axios';

/**
 * Contains all interaction to MatchService
 * 
 * @class MatchService
 * @extends {BaseService}
 */
class MatchService extends BaseService {
  /**
   * Get matches
   * 
   * @static
   * @param {number} [limit] 
   * @param {number} [page] 
   * @param {ObjectID[]} [ids] 
   * @returns {Promise<Match[]>} 
   * @memberof MatchService
   */
  static async getMatches(params: GetMatchesQueryParams) : Promise<Match[]> {
    try {
      const { data } = await this.axiosInstance.get('matches', {
        params,
      });
  
      return data;
    } catch (error) {
      const e : AxiosError = error;
      throw new MicroserviceError(this.name, e.config.baseURL);
    }
  }

  /**
   * Get leagues
   * 
   * @static
   * @param {ObjectID[]} [ids] 
   * @returns {Promise<League[]>} 
   * @memberof MatchService
   */
  static async getLeagues(ids? : ObjectID[]) : Promise<League[]> {
    try {
      const params : any = {};

      if (ids) {
        params.id = ids.map(id => id.toString());
      }

      const { data } = await this.axiosInstance.get('leagues', {
        params,
      });
  
      return data;
    } catch (error) {
      const e : AxiosError = error;
      throw new MicroserviceError(this.name, e.config.baseURL);
    }
  }
}

export default MatchService;
