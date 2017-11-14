import Match from '../entity/match';
import { EntityTakenError, EntityNotFoundError } from '../errors/errors';
import { Request, Response, ReplyNoContinue } from 'hapi';
import User, { Profile, SteamProvider } from '../entity/user';
import { getConnection, ObjectID } from 'typeorm';
import Prediction, { SelectedTeam } from '../entity/prediction';
import { List } from 'immutable';
import { badImplementation, conflict, notFound } from 'boom';
import axios from 'axios';
import TeamService from '../service/team';
import { ObjectId } from 'bson';
import { Stream } from 'stream';
import { streamToCloudinary, getCloudinaryPublicURL } from '../utils';

/**
 * ProfileResponse
 * 
 * @interface ProfileResponse
 * @extends {Profile}
 */
interface ProfileResponse extends Profile {}

/**
 * Reply interface for @getLoggedUserProfile
 * 
 * @interface GetLoggedUserProfileResponse
 */
interface GetLoggedUserProfileResponse {
  profile : ProfileResponse;
  predictions : PredictionResponse[];
}

/**
 * PredictionResponse
 * 
 * @interface PredictionResponse
 */
interface PredictionResponse {
  _id : ObjectID;
  text : string;
  match : {
    _id : ObjectID;
    homeTeam : string;
    awayTeam : string;
  };
  odds : number;
  stake : number;
  comments : number;
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
      const user : User = request.auth.credentials.user;
      const connection = getConnection();
      const predictionRepository = connection.getMongoRepository<Prediction>(Prediction);
      const matchRepository = connection.getMongoRepository<Match>(Match);

      const profileOfUser = user.getProfile(true);

      const userId = user._id;

      const predictionsOfUser = await predictionRepository.find({
        userId,
      });

      // construct base response object
      const response : GetLoggedUserProfileResponse = {
        profile: profileOfUser,
        predictions: [],
      };

      // populate it
      for (const { 
        _id, text, matchId, comments, selectedTeam, stake, oddsId,
      } of predictionsOfUser) {
  
        const match = await matchRepository.findOneById(matchId);
        const teams = await TeamService.getTeamsById([match.homeTeamId, match.awayTeamId]);
        
        /*
          Find out which odds he put on
        */
        const odds = match.odds.find(o => o._id.equals(oddsId));
        let selectedOdds = odds.home;

        if (selectedTeam === SelectedTeam.Away) {
          selectedOdds = odds.away;
        }

        /*
          Getting team names
        */

        let homeTeam = '';
        let awayTeam = '';
    
        if (teams.length > 0) {
          homeTeam = teams[0].name;
          awayTeam = teams[1].name;
        }
  
        const prediction : PredictionResponse = {
          _id,
          text,
          stake,
          match: {
            homeTeam,
            awayTeam,
            _id: matchId,
          },
          odds: selectedOdds,
          comments: comments.length,
        };
        response.predictions.push(prediction);
      }

      return reply(response);
    } catch (error) {
      return reply(badImplementation(error));
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
  
      const user : User = request.auth.credentials.user;
      const propsToEdit : Profile = request.payload;  

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

      const query : EditProfileQueryCheck = {
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
          email: propsToEdit.email,
        });
      }

      const match = await userRepository.findOne(query);

      if (match) {
        if (propsToEdit.username.toLowerCase() === match.username) {
          throw new EntityTakenError('User', 'username', propsToEdit.username);
        }
        throw new EntityTakenError('User', 'email', propsToEdit.email);
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
      const user : User = request.auth.credentials.user;
      const userRepository = getConnection().getMongoRepository<User>(User);
      const avatarStream : Stream = request.payload.avatar;

      const {
        public_id,
      } = await streamToCloudinary(avatarStream, {
        folder: 'avatars',
      });

      user.avatar = public_id;

      await userRepository.save(user);

      return reply({
        avatarURL : getCloudinaryPublicURL(public_id),
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
      const user : User = request.auth.credentials.user;
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

  static async getUserByUsername(request : Request, reply : ReplyNoContinue) : Promise<Response> {
    try {
      const userRepository = getConnection().getMongoRepository<User>(User);
      const matchRepository = getConnection().getMongoRepository<Match>(Match);
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

      const predictions : PredictionResponse[] = [];

      const response = {
        profile,
        predictions,
      };

      // populate it
      for (const { 
        _id, text, matchId, comments, selectedTeam, stake, oddsId,
      } of predictionsOfUser) {
  
        const match = await matchRepository.findOneById(matchId);
        const teams = await TeamService.getTeamsById([match.homeTeamId, match.awayTeamId]);
        
        /*
          Find out which odds he put on
        */
        const odds = match.odds.find(o => o._id.equals(oddsId));
        let selectedOdds = odds.home;

        if (selectedTeam === SelectedTeam.Away) {
          selectedOdds = odds.away;
        }

        /*
          Getting team names
        */

        let homeTeam = '';
        let awayTeam = '';
    
        if (teams.length > 0) {
          homeTeam = teams[0].name;
          awayTeam = teams[1].name;
        }
  
        const prediction : PredictionResponse = {
          _id,
          text,
          stake,
          match: {
            homeTeam,
            awayTeam,
            _id: matchId,
          },
          odds: selectedOdds,
          comments: comments.length,
        };
        response.predictions.push(prediction);
      }

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
