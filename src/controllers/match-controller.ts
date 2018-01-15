import MatchService from '../service/match';
import TeamService from '../service/team';
import { badImplementation, notFound } from 'boom';
import {
  Game,
  League,
  Match,
  MatchMapType,
  MatchOdds,
  MatchStatusType,
  MatchUpdate,
  Team,
  GetMatchesQueryParams,
} from 'ba-common';
import { getConnection, ObjectID } from 'typeorm';
import { ObjectId } from 'bson';
import { ReplyNoContinue, Request, Response } from 'hapi';
import { EntityNotFoundError } from '../errors';

/**
 * MatchResponse
 *
 * @interface MatchResponse
 */
interface MatchResponse {
  id : ObjectID;
  homeTeam : string;
  awayTeam : string;
  league : string;
  game : string;
  gameSlug : string;
  date : Date;
  isLive : boolean;
  state: {
    scores : {
      homeTeam : number;
      awayTeam : number;
    },
    type : MatchStatusType,
  };
}

/**
 * Aggregate match response
 *
 * @param {Team[]} teams
 * @param {Game[]} games
 * @param {League[]} leagues
 * @param {MatchUpdate[]} updates
 * @param {ObjectID} id
 * @param {Date} date
 * @returns
 */
function aggregateMatchResponse( teams: Team[], games: Game[], leagues: League[], updates: MatchUpdate[], id: ObjectID, date: Date) {
  const matchResponse : MatchResponse = {
    id,
    homeTeam: '',
    awayTeam: '',
    league: '',
    game: '',
    gameSlug: '',
    date,
    isLive: new Date(date).getTime() === new Date().getTime(),
    state: {
      type : MatchStatusType.Unknown,
      scores: {
        homeTeam: null,
        awayTeam: null,
      },
    },
  };

  /*
    Maps to success case
  */

  if (teams.length !== 0) {
    matchResponse.homeTeam = teams[0].name;
    matchResponse.awayTeam = teams[1].name;
  }

  if (games.length !== 0) {
    matchResponse.game = games[0].name;
    matchResponse.gameSlug = games[0].slug;
  }

  if (leagues.length !== 0) {
    matchResponse.league = leagues[0].name;
  }

  if (updates.length !== 0) {
    const orderedUpdates = updates
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

    matchResponse.state.type = orderedUpdates[0].statusType;

    if (orderedUpdates[0].statusType === MatchStatusType.Settled) {
      matchResponse.state.scores.homeTeam = orderedUpdates[0].homeTeamScore;
      matchResponse.state.scores.awayTeam = orderedUpdates[0].awayTeamScore;
    }
  }

  return matchResponse;
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
      const {
        page,
        limit,
        gameId,
        leagueId,
        homeTeamId,
        awayTeamId,
        statusType,
      } : {
        page : number; // default
        limit : number; // default
        gameId: string;
        leagueId: string;
        homeTeamId: string;
        awayTeamId: string;
        statusType: MatchStatusType;
      } = request.query;

      const query : GetMatchesQueryParams = {
        page: page.toString(),
        limit: limit.toString(),
      };

      if (gameId) {
        query.gameId = gameId;
      }

      if (leagueId) {
        query.leagueId = leagueId;
      }

      if (homeTeamId) {
        query.homeTeamId = homeTeamId;
      }

      if (awayTeamId) {
        query.awayTeamId = awayTeamId;
      }

      if (statusType) {
        query.statusType = statusType;
      }

      const { data: matches, headers } = await MatchService.getMatches(query);

      let mainBuffer : any[] = [];

      for (const match of matches) {
        const buffer = [
          // order
          TeamService.getTeams([match.homeTeamId, match.awayTeamId]),
          TeamService.getGames({ ids: match.gameId.toString() }),
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

        /*
          Default prop
        */
        const matchResponse = aggregateMatchResponse(teams, games, leagues, updates, id, date);
        matchesResponse.push(matchResponse);
      }

      return reply(matchesResponse).header('Count', headers.count);
    } catch (error) {
      return reply(badImplementation(error));
    }
  }

  /**
   * Get match by id
   *
   * @static
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   * @memberof MatchController
   */
  static async getMatch(request: Request, reply: ReplyNoContinue): Promise<Response> {
    try {
      const matchId = request.params.matchId;

      const { data: matches } = await MatchService.getMatches({
        ids: matchId,
      });

      if (matches.length === 0) {
        throw new EntityNotFoundError('Match', 'id', matchId);
      }

      const match = matches[0];

      const teams = await TeamService.getTeams([match.homeTeamId, match.awayTeamId]);
      const games = await TeamService.getGames({ ids: match.gameId.toString() });
      const leagues = await MatchService.getLeagues([match.leagueId]);

      const matchResponse = aggregateMatchResponse(
        teams, games, leagues, match.updates, match._id, match.date);

      return reply(matchResponse);

    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply(notFound(error.message));
      }
      return reply(badImplementation(error));
    }
  }
}

export default MatchController;
