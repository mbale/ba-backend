import * as dotenv from 'dotenv';
import axios from 'axios';
import { ObjectID } from 'typeorm';
import BaseService from './base';
import { Match } from '../../../ba_matchservice/src/entity/match';

/**
 * Contains all interaction to MatchService
 * 
 * @class MatchService
 * @extends {BaseService}
 */
class MatchService extends BaseService {
  /**
   * Get matches by Id
   * 
   * @static
   * @param {ObjectID[]} ids 
   * @returns {Promise<any[]>} 
   * @memberof MatchService
   */
  static async getMatchesById(ids : ObjectID[]) : Promise<Match[]> {
    try {
      const { data } = await this.axiosInstance.get('matches', {
        params: {
          id: ids.map(id => id.toString()),
        },
      });
      return data;
    } catch (error) {
      return [];
    }
  }
}

export default MatchService;
