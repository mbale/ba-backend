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
      const {
        page,
        limit,
      } : {
        page : number;
        limit : number;
      } = request.query;

      console.log(page)
      console.log(limit)

      const matches = await MatchService.getMatches(null, limit, page);

      let mainBuffer : any[] = [];

      for (const match of matches) {
        const buffer = [];

        // order is important
        buffer.push(
          TeamService.getTeams([match.homeTeamId, match.awayTeamId]),
          TeamService.getGames([match.gameId]),
          MatchService.getLeagues([match.leagueId]),
          match._id,
          match.date,
          match.odds,
          match.updates,
        );

        mainBuffer.push(buffer);
      }

      mainBuffer = await Promise.all(mainBuffer.map((match => Promise.all(match))));

      return reply(mainBuffer);
    } catch (error) {
      return reply(badImplementation(error));
    }
  }
}

export default MatchController;
