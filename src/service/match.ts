import * as dotenv from 'dotenv';
import axios from 'axios';
import { ObjectID } from 'typeorm';
import BaseService from './base';
import { Match } from 'ba-common';

/**
 * Contains all interaction to MatchService
 * 
 * @class MatchService
 * @extends {BaseService}
 */
class MatchService extends BaseService {
  /**
   * Get matches (or by id - optional)
   * 
   * @static
   * @param {ObjectID[]} ids 
   * @returns {Promise<any[]>} 
   * @memberof MatchService
   */
  static async getMatches(ids? : ObjectID[]) : Promise<Match[]> {
    try {
      const params : any = {};

      if (ids) {
        params.id = ids.map(id => id.toString());
      }

      const { data } = await this.axiosInstance.get('matches', {
        params,
      });
  
      return data;
    } catch (error) {
      return [];
    }
  }
}

export default MatchService;
