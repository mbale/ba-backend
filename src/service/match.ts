import * as dotenv from 'dotenv';
import axios from 'axios';
import { ObjectID } from 'typeorm';
import BaseService from './base';
import { Match, League } from 'ba-common';

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
   * @param {ObjectID[]} [ids] 
   * @param {number} [limit] 
   * @param {number} [page] 
   * @returns {Promise<Match[]>} 
   * @memberof MatchService
   */
  static async getMatches(ids? : ObjectID[], limit? : number, page? : number) : Promise<Match[]> {
    try {
      const params : {
        id? : string[],
        limit? : number;
        page? : number;
      } = {
        id : [],
      };

      if (ids) {
        params.id = ids.map(id => id.toString());
      }

      if (limit && page) {
        params.limit = limit;
        params.page = page;
      }

      const { data } = await this.axiosInstance.get('matches', {
        params,
      });
  
      return data;
    } catch (error) {
      return [];
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
      return [];
    }
  }
}

export default MatchService;
