import * as dotenv from 'dotenv';
import axios from 'axios';
import { ObjectID } from 'typeorm';
import BaseService from './base';
import { Team, Game } from 'ba-common';

/**
 * Contains all interaction to Teamservice
 * 
 * @class TeamService
 * @extends {BaseService}
 */
class TeamService extends BaseService {
  /**
   * Get teams
   * 
   * @static
   * @param {ObjectID[]} [ids] 
   * @returns {Promise<Team[]>} 
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

  /**
   * Get games
   * 
   * @static
   * @param {ObjectID[]} [ids] 
   * @returns {Promise<Game[]>} 
   * @memberof TeamService
   */
  static async getGames(ids? : ObjectID[]) : Promise<Game[]> {
    try {
      const params : any = {};

      if (ids) {
        params.id = ids.map(id => id.toString());
      }
      const { data } = await this.axiosInstance.get('games', {
        params,
      });
      return data;
    } catch (error) {
      return [];
    }
  }
}

export default TeamService;
