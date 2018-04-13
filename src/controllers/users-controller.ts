import { EntityTakenError, EntityNotFoundError, InvalidSteamIdError } from '../errors';
import { Request, Response, ReplyNoContinue } from 'hapi';
import User, { Profile, SteamProvider } from '../entity/user';
import { getConnection, ObjectID, MongoRepository } from 'typeorm';
import Prediction, { SelectedTeam } from '../entity/prediction';
import { badImplementation, conflict, notFound, badData } from 'boom';
import axios from 'axios';
import TeamService from '../service/team';
import { ObjectId } from 'bson';
import { Stream } from 'stream';
import { streamToCloudinary, getCloudinaryPublicURL, tryQuerySteamData } from '../utils';
import MatchService from '../service/match';
import { Team, Match, Game } from 'ba-common';
import * as rabbot from 'rabbot';
import { createReadStream } from 'fs';

const STEAM_API_KEY = process.env.BACKEND_STEAM_API_KEY;

/**
 * PredictionResponse
 *
 * @interface PredictionResponse
 */
interface PredictionResponse {
  id: ObjectID;
  text: string;
  match: {
    urlId: string;
    homeTeam: string;
    awayTeam: string;
  };
  gameSlug: string;
  odds: number;
  stake: number;
  comments: number;
}

/**
 * Aggregate predictions of user into an array
 *
 * @param {Prediction[]} predictionsOfUser
 * @param {Match[]} matches
 * @param {Team[]} teams
 * @returns
 */
function aggregatePredictions(
  predictionsOfUser : Prediction[], matches: Match[], teams: Team[], games: Game[]) {
  const predictions : PredictionResponse[] = [];
  // populate it
  for (
    const { _id: id, text, stake, matchId, oddsId, comments, selectedTeam } of predictionsOfUser) {
    const match = matches.find(m => new ObjectId(m._id).equals(matchId));
    const game = games.find(g => new ObjectId(g._id).equals(match.gameId));

    const {
      awayTeamId,
      homeTeamId,
    } = match;

    const homeTeam = teams.find(t => new ObjectId(t._id).equals(homeTeamId)).name;
    const awayTeam = teams.find(t => new ObjectId(t._id).equals(awayTeamId)).name;

    const odds = match.odds.find(o => new ObjectId(o._id).equals(oddsId));
    let selectedOdds = odds.home;

    if (selectedTeam === SelectedTeam.Away) {
      selectedOdds = odds.away;
    }

    const p: PredictionResponse = {
      id,
      text,
      stake,
      match: {
        homeTeam,
        awayTeam,
        urlId: match.urlId,
      },
      gameSlug: game.slug,
      odds: selectedOdds,
      comments: comments.length,
    };

    predictions.push(p);
  }

  return predictions;
}

class UsersController {
  /**
   * Get logged-in user profile
   *
   * @static
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   * @memberof UsersController
   */
  static async getLoggedUserProfile(request : Request, reply : ReplyNoContinue)
  : Promise<Response> {
    try {
      const user: User = request.auth.credentials.user;
      const profile = user.getProfile(true);

      const connection = getConnection();
      const predictionRepository = connection.getMongoRepository<Prediction>(Prediction);

      const predictionsOfUser = await predictionRepository.find({
        userId : user._id,
      });

      const { ack: matchSRequestAck, body: matchSRequest } = await rabbot.request('match-service', {
        type: 'get-matches-by-ids',
        body: predictionsOfUser.map(p => p.matchId),
      });

      matchSRequestAck();

      const matches: Match[] = matchSRequest.matches || [];

      const teamIds = [];
      const gameIds = [];

      matches.forEach((match) => {
        teamIds.push(match.homeTeamId);
        teamIds.push(match.awayTeamId);
        gameIds.push(match.gameId);
      });

      const { ack: teamSRequestAck, body: teamSRequest } = await rabbot.request('team-service', {
        type: 'get-teams-by-ids',
        body: teamIds,
      });

      const {
        ack: teamSGameRequestAck,
        body: teamSGameRequest,
      } = await rabbot.request('team-service', {
        type: 'get-games-by-ids',
        body: gameIds,
      });

      teamSRequestAck();
      teamSGameRequestAck();

      const teams: Team[] = teamSRequest.teams || [];
      const games: Game[] = teamSGameRequest.games || [];

      const predictions = aggregatePredictions(predictionsOfUser, matches, teams, games);

      const response: {
        profile: Profile;
        predictions: PredictionResponse[]
      } = {
        profile,
        predictions,
      };

      return reply(response);
    } catch (error) {
      return reply(badImplementation(error));
    }
  }

  /**
   * Attach steam account to logged user
   *
   * @static
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns
   * @memberof UsersController
   */
  static async attachSteamProvider(request: Request, reply: ReplyNoContinue) {
    try {
      const { steamId } : { steamId: string } = request.payload;
      const userRepository = getConnection().getMongoRepository<User>(User);
      const user: User = request.auth.credentials.user;

      const anotherUser = await userRepository.findOne({
        where: {
          'steamProvider.steamId': steamId,
          _id: {
            $ne: user._id,
          },
        },
      });

      if (anotherUser) {
        throw new EntityTakenError('User', 'steamId', steamId);
      }

      try {
        // get steam data anyway
        const steamData = await tryQuerySteamData(steamId, STEAM_API_KEY);

        // refresh it anyway
        user.steamProvider = steamData;

        await userRepository.save(user);
      } catch (e) {
        throw new InvalidSteamIdError(steamId);
      }

      return reply();
    } catch (error) {
      if (error instanceof EntityTakenError) {
        return reply(conflict(error.message));
      }
      if (error instanceof InvalidSteamIdError) {
        return reply(badData(error.message));
      }
    }
  }

  /**
   * Endpoint to edit logged-in user profile
   *
   * @static
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   * @memberof UsersController
   */
  static async editLoggedUserProfile(request : Request, reply : ReplyNoContinue)
  : Promise<Response> {
    try {
      const userRepository = getConnection().getMongoRepository<User>(User);

      const user: User = request.auth.credentials.user;
      const propsToEdit: {
        username?: string;
        password?: string;
        countryCode?: string;
        email?: string;
      } = request.payload;

      interface EditProfileQueryCheck {
        where : {
          _id: {
            $ne: ObjectID;
          },
          $or?: object[],
        };
      }

      /*
        Check if other user already has the same username or email
      */

      const query: EditProfileQueryCheck = {
        where: {
          _id: {
            $ne: user._id,
          },
          $or: [],
        },
      };

      /*
        Unique values
      */

      if (propsToEdit.username) {
        query.where.$or.push({
          username: propsToEdit.username.toLowerCase(),
        });
      }

      if (propsToEdit.email) {
        query.where.$or.push({
          email: propsToEdit.email.toLowerCase(),
        });
      }

      // check if we need to query
      if (query.where.$or.length > 0) {
        const match = await userRepository.findOne(query);

        if (match) {
          if (propsToEdit.username) {
            if (propsToEdit.username.toLowerCase() === match.username) {
              throw new EntityTakenError('User', 'username', propsToEdit.username);
            }
          }
          throw new EntityTakenError('User', 'email', propsToEdit.email);
        }
      }

      await user.editProfileDetails(propsToEdit);

      await userRepository.save(user);
      return reply();
    } catch (error) {
      if (error instanceof EntityTakenError) {
        return reply(conflict(error.message));
      }
      return reply(badImplementation(error));
    }
  }

  /**
   * Upload user's avatar to cloudinary
   *
   * @static
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   * @memberof UsersController
   */
  static async uploadAvatar(request : Request, reply : ReplyNoContinue) : Promise<Response> {
    try {
      const user: User = request.auth.credentials.user;
      const userRepository = getConnection().getMongoRepository<User>(User);
      const avatarStream: Buffer = request.payload.avatar;

      const { public_id } = await streamToCloudinary(avatarStream, {
        folder: 'avatars',
      });

      user.avatar = public_id;

      await userRepository.save(user);

      return reply({
        avatarURL: getCloudinaryPublicURL(public_id),
      });
    } catch (error) {
      return reply(badImplementation(error));
    }
  }

  /**
   * Unset user's avatar
   *
   * @static
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   * @memberof UsersController
   */
  static async deleteAvatar(request : Request, reply : ReplyNoContinue) : Promise<Response> {
    try {
      const user: User = request.auth.credentials.user;
      const userRepository = getConnection().getMongoRepository<User>(User);

      user.avatar = '';

      await userRepository.save(user);
      return reply();
    } catch (error) {
      return reply(badImplementation(error));
    }
  }

  /**
   * Creating user
   *
   * @static
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   * @memberof UsersController
   */
  static async createUser(request : Request, reply : ReplyNoContinue) : Promise<Response> {
    try {
      const {
        payload: {
          username,
          password,
          email,
        },
      } = request;

      const userRepository = getConnection().getMongoRepository<User>(User);

      // check if we've the same user
      // email / username
      const match = await userRepository.findOne({
        where: {
          $or: [{
            username,
          }, {
            email,
          }],
        },
      });

      if (match) {
        if (username === match.username) {
          throw new EntityTakenError('User', 'username', username);
        }
        throw new EntityTakenError('User', 'email', email);
      }

      const user = new User();
      user.username = username;
      user.password = password;
      user.email = email;

      await user.hashPassword();

      const accessToken = user.authorizeAccess();

      await userRepository.save(user);

      return reply({
        accessToken,
      });
    } catch (error) {
      if (error instanceof EntityTakenError) {
        return reply(conflict(error.message));
      }
      return reply(badImplementation(error));
    }
  }

  /**
   * Get user by username
   *
   * @static
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   * @memberof UsersController
   */
  static async getUserByUsername(request : Request, reply : ReplyNoContinue) : Promise<Response> {
    try {
      const userRepository = getConnection().getMongoRepository<User>(User);
      const predictionRepository = getConnection().getMongoRepository<Prediction>(Prediction);

      const username = request.params.username;

      const user = await userRepository.findOne({
        username,
      });

      if (!user) {
        throw new EntityNotFoundError('User', 'username', username);
      }

      const predictionsOfUser = await predictionRepository.find({
        userId: user._id,
      });

      const profile = user.getProfile();

      const { ack: matchSRequestAck, body: matchSRequest } = await rabbot.request('match-service', {
        type: 'get-matches-by-ids',
        body: predictionsOfUser.map(p => p.matchId),
      });

      matchSRequestAck();

      const matches: Match[] = matchSRequest.matches || [];

      const teamIds = [];
      const gameIds = [];

      matches.forEach((match) => {
        teamIds.push(match.homeTeamId);
        teamIds.push(match.awayTeamId);
        gameIds.push(match.gameId);
      });

      const { ack: teamSRequestAck, body: teamSRequest } = await rabbot.request('team-service', {
        type: 'get-teams-by-ids',
        body: teamIds,
      });

      const {
        ack: teamSGameRequestAck,
        body: teamSGameRequest,
      } = await rabbot.request('team-service', {
        type: 'get-games-by-ids',
        body: gameIds,
      });

      teamSRequestAck();
      teamSGameRequestAck();

      const teams: Team[] = teamSRequest.teams || [];
      const games: Game[] = teamSGameRequest.games || [];

      const predictions = aggregatePredictions(predictionsOfUser, matches, teams, games);

      const response: {
        profile: Profile;
        predictions: PredictionResponse[]
      } = {
        profile,
        predictions,
      };

      return reply(response);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply(notFound(error.message));
      }
      return reply(badImplementation(error));
    }
  }
}

export default UsersController;
