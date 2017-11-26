import * as dotenv from 'dotenv';
import axios from 'axios';
import { ObjectID } from 'typeorm';
import BaseService from './base';
import { Team } from 'ba-common';

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
  static async getTeams(ids? : ObjectID[]) : Promise<Team[]> {
    try {
      const params : any = {};
      
      if (ids) {
        params.id = ids.map(id => id.toString());
      }
      const { data } = await this.axiosInstance.get('teams', {
        params,
      });
      return data;
    } catch (error) {
      return [];
    }
  }

  // static async getGame(id : ObjectID[]) : Promise<Game[]> {
  //   try {
  //     const params : any = {};

  //     if (ids) {
  //       params.id = ids.map(id => id.toString());
  //     }
  //     const { data } = await this.axiosInstance.get('matches', {
  //       params,
  //     });
  //     return data;
  //   } catch (error) {
  //     return [];
  //   }
  // }
}

export default TeamService;
