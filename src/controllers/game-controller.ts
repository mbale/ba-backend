import { Request, ReplyNoContinue, Response } from 'hapi';
import { badImplementation, notFound } from 'boom';
import { getContentfulClient } from '../utils';
import { Entry } from 'contentful';
import { EntityNotFoundError } from '../errors';
import { ObjectID } from 'typeorm';
import TeamService from '../service/team';

/**
 * Interface for game in contentful
 * 
 * @interface GameResponse
 */
interface GameResponse {
  name : string;
  id: ObjectID;
  slug : string;
  logo : string;
  color : string;
  description : string;
}

/**
 * Serialize JSON response for games to object
 * 
 * @param {Entry<any>} contentfulItem 
 * @returns {GameResponse[]} 
 */
async function serializeGameResponse(contentfulItem : Entry<any>) : Promise<GameResponse> {
  // get id from our db
  const games = await TeamService.getGames({
    slug: contentfulItem.fields.slug,
  });

  let gameId: ObjectID = null;

  // there can be a case at start that we don't have that match
  if (games.length !== 0) {
    gameId = games[0]._id;
  }

  return {
    name: contentfulItem.fields.name,
    id: gameId,
    slug: contentfulItem.fields.slug,
    logo : contentfulItem.fields.logo.fields.file.url,
    color : contentfulItem.fields.color,
    description : contentfulItem.fields.description,
  };
}

class GameController {
  /**
   * Get all games
   * 
   * @static
   * @param {Request} request 
   * @param {ReplyNoContinue} reply 
   * @returns {Promise<Response>} 
   * @memberof GameController
   */
  static async getGames(request : Request, reply : ReplyNoContinue) : Promise<Response> {
    try {
      const client = await getContentfulClient();
      
      const { items } = await client.getEntries({
        content_type: 'game',
      });

      const response : GameResponse[] = [];
      
      for (const item of items) {
        const game = serializeGameResponse(item);
        response.push(await game);
      }

      return reply(response);
    } catch (error) {
      return reply(badImplementation(error));
    }
  }

  /**
   * Get game by slug from contentful
   * 
   * @static
   * @param {Request} request 
   * @param {ReplyNoContinue} reply 
   * @returns {Promise<Response>} 
   * @memberof GameController
   */
  static async getGameBySlug(request : Request, reply : ReplyNoContinue) : Promise<Response> {
    try {
      const gameSlug = request.params.gameSlug;

      const client = await getContentfulClient();

      const { items : games } = await client.getEntries({
        content_type: 'game',
        'fields.slug': gameSlug,
      });

      if (games.length === 0) {
        throw new EntityNotFoundError('Game', 'slug', gameSlug);
      }
      
      const game = serializeGameResponse(games[0]);
        
      return reply(game);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply(notFound(error.message));
      }
      return reply(badImplementation(error));
    }
  }
}

export default GameController;
