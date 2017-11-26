import { Request, Response, ReplyNoContinue } from 'hapi';
import { badImplementation } from 'boom';
import { getConnection } from 'typeorm';
import { ObjectId } from 'bson';
import { Match } from 'ba-common';
import MatchService from '../service/match';
import TeamService from '../service/team';

class MatchController {
  /**
   * Get matches
   * 
   * @static
   * @param {Request} request 
   * @param {ReplyNoContinue} reply 
   * @returns {Promise<Response>} 
   * @memberof MatchController
   */
  static async getMatches(request : Request, reply : ReplyNoContinue) : Promise<Response> {
    try {
      const page = request.query.page;

      const matches = await MatchService.getMatches();

      for (const match of matches) {
      }

      return reply(matches);
    } catch (error) {
      return reply(badImplementation(error));
    }
  }
}

export default MatchController;
