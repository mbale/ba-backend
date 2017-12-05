import * as dotenv from 'dotenv';
import axios, { AxiosError } from 'axios';
import { ObjectID } from 'typeorm';
import BaseService from './base';
import { Team, Game, GetGamesQueryParams } from 'ba-common';
import { MicroserviceError } from '../errors';

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
      const e: AxiosError = error;
      throw new MicroserviceError(this.name, e.config.baseURL);
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
  static async getGames(params: GetGamesQueryParams) : Promise<Game[]> {
    try {
      const { data } = await this.axiosInstance.get('games', {
        params,
      });
  
      return data;
    } catch (error) {
      const e : AxiosError = error;
      throw new MicroserviceError(this.name, e.config.baseURL);
    }
  }
}

export default TeamService;
