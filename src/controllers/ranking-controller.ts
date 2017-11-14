import * as Hapi from 'hapi';
import * as Boom from 'boom';
import {
   getConnection,
} from 'typeorm';
// import {
//   Match,
// } from '../entities/match-entity';

export default class LeaderboardController {
  static async getLatest(request: Hapi.Request, response: Hapi.ReplyNoContinue) {
    try {
      const {
        params,
      } = request;

      const repository = getConnection().getMongoRepository('Match');
      const cursor = repository.createEntityCursor();

      let matches = [];
      
      // while (await cursor.hasNext()) {
      //   const {
      //     predictions,
      //   }: Match  = await cursor.next();
      //   if (predictions.length > 0) {
      //     matches.push(predictions);
      //   }
      // }

      // matches = await repository.find();

      return response(matches);
    } catch (error) {
      return response(Boom.badImplementation(error));
    }
  }
}