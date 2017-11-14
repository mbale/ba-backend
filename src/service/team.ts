import * as dotenv from 'dotenv';
import axios from 'axios';
import { ObjectID } from 'typeorm';
import BaseService from './base';

/**
 * Contains all interaction to Teamservice
 * 
 * @class TeamService
 * @extends {BaseService}
 */
class TeamService extends BaseService {
  /**
   * Get teams by Id
   * 
   * @static
   * @param {ObjectID[]} ids 
   * @returns {Promise<any[]>} 
   * @memberof TeamService
   */
  static async getTeamsById(ids : ObjectID[]) : Promise<any[]> {
    try {
      const { data } = await this.axiosInstance.get('teams', {
        params: {
          ids: ids.map(id => id.toString()),
        },
      });
      return data;
    } catch (error) {
      return [];
    }
  }
}

export default TeamService;
