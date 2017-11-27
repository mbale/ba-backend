import MatchService from '../service/match';
import TeamService from '../service/team';
import { badImplementation } from 'boom';
import {
  Game,
  League,
  Match,
  MatchMapType,
  MatchOdds,
  MatchStatusType,
  MatchUpdate,
  Team,
} from 'ba-common';
import { getConnection, ObjectID } from 'typeorm';
import { ObjectId } from 'bson';
import { ReplyNoContinue, Request, Response } from 'hapi';

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

      const matches = await MatchService.getMatches(null, limit, page);

      type Buffer = [
        Promise<Team[]>|Promise<Game[]>|ObjectID|Date|MatchOdds[]|MatchUpdate[]
      ];

      let mainBuffer : any[] = [];

      for (const match of matches) {
        const buffer = [
          // order
          TeamService.getTeams([match.homeTeamId, match.awayTeamId]),
          TeamService.getGames([match.gameId]),
          MatchService.getLeagues([match.leagueId]),
          match._id,
          match.date,
          match.odds,
          match.updates,
        ];

        mainBuffer.push(buffer);
      }

      mainBuffer = await Promise.all(mainBuffer.map((buffer => Promise.all(buffer))));

      const matchesResponse : MatchResponse[] = [];

      for (const buffer of mainBuffer) {
        // order
        const [
          teams,
          games,
          leagues,
          id,
          date,
          odds,
          updates,
        ] : [
          Team[],
          Game[],
          League[],
          ObjectID,
          Date,
          MatchOdds[],
          MatchUpdate[]
        ] = buffer; //

        const state = {
          scores : {
            homeTeam: null,
            awayTeam: null,
          },
          type : null,
        };

        if (updates.length !== 0) {
          const orderedUpdates = updates
            .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

          state.type = orderedUpdates[0].statusType;

          if (orderedUpdates[0].statusType === MatchStatusType.Settled) {
            state.scores.homeTeam = orderedUpdates[0].homeTeamScore;
            state.scores.awayTeam = orderedUpdates[1].awayTeamScore;
          }
        }

        matchesResponse.push({
          id,
          homeTeam: teams[0].name,
          awayTeam: teams[1].name,
          league: leagues[0].name,
          game: games[0].name,
          gameSlug: games[0].slug,
          isLive: new Date(date).getTime() === new Date().getTime(),
          state,
        });
      }

      interface MatchResponse {
        id : ObjectID;
        homeTeam : string;
        awayTeam : string;
        league : string;
        game : string;
        gameSlug : string;
        isLive : boolean;
        state: {
          scores : {
            homeTeam : number;
            awayTeam : number;
          },
          type : MatchStatusType,
        };
      }

      return reply(matchesResponse);
    } catch (error) {
      return reply(badImplementation(error));
    }
  }
}

export default MatchController;
