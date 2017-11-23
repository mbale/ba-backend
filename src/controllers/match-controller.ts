import { Request, Response, ReplyNoContinue } from 'hapi';
import { badImplementation } from 'boom';
import { getConnection } from 'typeorm';
import { ObjectId } from 'bson';
import Match from '../entity/match';

interface MatchResponse {
  id : ObjectId;
  game : string;
  league : string;
  homeTeam : string;
  awayTeam : string;
  date : Date;
  odds : [{
    home : number;
    away : number;
    fetchedAt : Date;
    type : string;
    id : ObjectId;
  }];
  updates : [{
    mapType : string;
    statusType : string;
    endDate : Date;
    homeTeamScore : number;
    awayTeamScore : number;
    addedAt : Date;
  }];
}

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
      
      const response : MatchResponse[] = [];

      return reply(response);
    } catch (error) {
      return reply(badImplementation(error));
    }
  }
}

export default MatchController;
