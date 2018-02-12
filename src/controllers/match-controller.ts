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
import Prediction, { SelectedTeam } from '../entity/prediction';
import User, { Profile } from '../entity/user';


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
  odds: MatchOdds[];
  predictions?: {
    text: string;
    id: ObjectId;
    user: Profile;
    odds: MatchOdds;
    selectedTeam: SelectedTeam;
  }[];
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
function aggregateMatchResponse(
  teams: Team[], games: Game[], leagues: League[],
  updates: MatchUpdate[], id: ObjectID, date: Date, odds: MatchOdds[]) {
  const matchResponse : MatchResponse = {
    odds,
    date,
    id,
    homeTeam: '',
    awayTeam: '',
    league: '',
    game: '',
    gameSlug: '',
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
        'gameIds[]': gameIds,
        leagueId,
        homeTeamId,
        awayTeamId,
        gameSlugs,
        statusType,
      } : {
        page : number; // default
        limit : number; // default
        'gameIds[]': string[] | string;
        gameSlugs: string[];
        leagueId: string;
        homeTeamId: string;
        awayTeamId: string;
        statusType: MatchStatusType;
      } = request.query;

      const query : GetMatchesQueryParams = {
        page: page.toString(),
        limit: limit.toString(),
      };

      if (gameIds) {
        if (gameIds instanceof Array) {
          query.gameIds = gameIds;
        } else {
          query.gameIds = [gameIds];
        }
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
        const matchResponse = aggregateMatchResponse
        (teams, games, leagues, updates, id, date, odds);

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

      const predictionRepository = getConnection()
        .getMongoRepository<Prediction>(Prediction);

      const userRepository = getConnection()
        .getMongoRepository<User>(User);

      const predictions = await predictionRepository.find({
        matchId: new ObjectId(match._id),
      });

      const teams = await TeamService.getTeams([match.homeTeamId, match.awayTeamId]);
      const games = await TeamService.getGames({ ids: match.gameId.toString() });
      const leagues = await MatchService.getLeagues([match.leagueId]);

      const matchResponse = aggregateMatchResponse(
        teams, games, leagues, match.updates, match._id, match.date, match.odds);

      matchResponse.predictions = [];

      for (const p of predictions) {
        const user = await userRepository.findOneById(p.userId);
        const odds = matchResponse.odds.find(o => new ObjectId(o._id).equals(p.oddsId));

        matchResponse.predictions.push({
          text: p.text,
          id: p._id,
          odds,
          user: user.getProfile(),
          selectedTeam: p.selectedTeam,
        });
      }

      return reply(matchResponse);

    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply(notFound(error.message));
      }
      return reply(badImplementation(error));
    }
  }

  static async addPrediction(request: Request, reply: ReplyNoContinue): Promise<Response> {
    try {
      const matchId = request.params.matchId;
      const {
        payload: {
          stake,
          text,
          oddsId,
          team,
        },
      } = request;

      const user: User = request.auth.credentials.user;

      const repository = getConnection()
        .getMongoRepository<Prediction>(Prediction);

      const { data: matches } = await MatchService.getMatches({
        ids: matchId,
      });

      if (matches.length === 0) {
        throw new EntityNotFoundError('match', 'id', matchId);
      }

      const match: Match = matches[0];

      const oddsAvailable = match.odds.find(o => new ObjectId(o._id).equals(oddsId));

      if (!oddsAvailable) {
        throw new EntityNotFoundError('odds', 'id', oddsId);
      }

      const prediction = new Prediction();

      prediction.matchId = new ObjectId(match._id);
      prediction.oddsId = new ObjectId(oddsId);
      prediction.selectedTeam = team;
      prediction.text = text;
      prediction.userId = user._id;

      await repository.save(prediction);

      return reply();
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply(notFound(error.message));
      }
      return reply(badImplementation(error));
    }
  }
}

export default MatchController;
