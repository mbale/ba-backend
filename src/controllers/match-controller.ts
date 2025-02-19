import { EntityTakenError } from './../errors';
import MatchService from '../service/match';
import TeamService from '../service/team';
import { badImplementation, notFound, badRequest, conflict } from 'boom';
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
import { EntityNotFoundError, EntityInvalidError } from '../errors';
import Prediction, { SelectedTeam } from '../entity/prediction';
import User, { Profile } from '../entity/user';
import * as rabbot from 'rabbot';


/**
 * MatchResponse
 *
 * @interface MatchResponse
 */
interface MatchResponse {
  id : ObjectID;
  urlId: string;
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
    stake: Number;
    date: Date;
  }[];
  predictionCount?: number;
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
  updates: MatchUpdate[],
  id: ObjectID, date: Date, odds: MatchOdds[],
  predictionCount: number = 0, urlId: string) {
  const matchResponse: MatchResponse = {
    odds,
    date,
    id,
    urlId,
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

  const orderedOdds = odds
    .sort((a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime());

  matchResponse.odds = orderedOdds;

  matchResponse.predictionCount = predictionCount;

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

      const predictionRepository = getConnection()
        .getMongoRepository<Prediction>(Prediction);

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
          match.urlId,
          predictionRepository.count({
            matchId: new ObjectId(match._id),
          }),
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
          urlId,
          count,
        ] : [
          Team[],
          Game[],
          League[],
          ObjectID,
          Date,
          MatchOdds[],
          MatchUpdate[],
          string,
          number
        ] = buffer; //

        /*
          Default prop
        */
        const matchResponse = aggregateMatchResponse
        (teams, games, leagues, updates, id, date, odds, count, urlId);

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

      const { ack: matchSRequestAck, body: matchSRequest } = await rabbot.request('match-service', {
        type: 'get-match-by-url-id',
        body: matchId,
      });

      matchSRequestAck();

      const [match]: [Match] = matchSRequest.match;

      if (!match) {
        throw new EntityNotFoundError('Match', 'id', matchId);
      }

      const predictionRepository = getConnection()
        .getMongoRepository<Prediction>(Prediction);

      const userRepository = getConnection()
        .getMongoRepository<User>(User);

      const predictions = await predictionRepository.find({
        matchId: new ObjectId(match._id),
      });

      const [teamsRequest, gameRequest, leagueRequest] = await Promise.all([
        rabbot.request('team-service', {
          type: 'get-teams-by-ids',
          body: [match.homeTeamId, match.awayTeamId],
        }),
        rabbot.request('team-service', {
          type: 'get-games-by-ids',
          body: [match.gameId],
        }),
        rabbot.request('match-service', {
          type: 'get-leagues-by-ids',
          body: [match.leagueId],
        }),
      ]);

      // ack
      teamsRequest.ack();
      gameRequest.ack();
      leagueRequest.ack();

      const [homeTeam, awayTeam]: Team[] = teamsRequest.body.teams;
      const [game]: Game[] = gameRequest.body.games;
      const [league]: League[] = leagueRequest.body.leagues;

      const predictionCount = predictions.length;

      const matchResponse = aggregateMatchResponse(
        [homeTeam, awayTeam], [game],
        [league], match.updates, match._id,
        match.date, match.odds, predictionCount, match.urlId);

      matchResponse.predictions = [];

      for (const p of predictions) {
        const user = await userRepository.findOneById(p.userId);
        const odds = matchResponse.odds.find(o => new ObjectId(o._id).equals(p.oddsId));
        const date = p._id.getTimestamp();

        matchResponse.predictions.push({
          odds,
          text: p.text,
          id: p._id,
          user: user.getProfile(),
          selectedTeam: p.selectedTeam,
          stake: p.stake,
          date
        });
      }

      matchResponse.odds = [matchResponse.odds[0]];

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

      // check if user haven't made bet yet
      const alreadyPredicted = await repository.findOne({
        matchId: new ObjectId(matchId),
      });

      if (alreadyPredicted) {
        throw new EntityTakenError('Bet', 'matchId', matchId);
      }

      const { ack: matchSRequestAck, body: matchSRequest } = await rabbot.request('match-service', {
        type: 'get-matches-by-ids',
        body: [matchId],
      });

      matchSRequestAck();

      const [match]: [Match] = matchSRequest.matches;

      if (!match) {
        throw new EntityNotFoundError('Match', 'id', matchId);
      }

      const odds = match.odds.find(o => new ObjectId(o._id).equals(oddsId));

      if (!odds) {
        throw new EntityNotFoundError('Odds', 'id', oddsId);
      }

      // check if it's the latest
      const sortedOddsByDate = match.odds
        .sort((a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime());

      // check if it's the latest one
      if (!new ObjectId(sortedOddsByDate[0]._id).equals(oddsId)) {
        throw new EntityInvalidError('Odds', 'id', `It's obsolete`);
      }

      // check whether stake is valid or out of range
      let teamOdds = odds.away;

      if (team === SelectedTeam.Home) {
        teamOdds = odds.home;
      }

      let allowedMaxStake = 0.5;

      // interval check
      if (teamOdds < 2.5) {
        allowedMaxStake = 3;
      }

      if (teamOdds >= 2.5 && teamOdds < 5) {
        allowedMaxStake = 2;
      }

      if (teamOdds >= 5 && teamOdds < 7.5) {
        allowedMaxStake = 1;
      }

      if (stake > allowedMaxStake) {
        throw new EntityInvalidError('Odds', 'stake', `Stake is out of allowed range`);
      }

      const prediction = new Prediction();

      prediction.matchId = new ObjectId(match._id);
      prediction.oddsId = oddsId;
      prediction.selectedTeam = team;
      prediction.text = text || '';
      prediction.userId = user._id;
      prediction.stake = stake;

      await repository.save(prediction);

      return reply();
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply(notFound(error.message));
      }
      if (error instanceof EntityInvalidError) {
        return reply(badRequest(error.message));
      }
      if (error instanceof EntityTakenError) {
        return reply(conflict(error.message));
      }

      return reply(badImplementation(error));
    }
  }
}

export default MatchController;
