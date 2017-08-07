import {
  ObjectId,
} from 'mongorito';
import Match from '../models/match-model.js';
import League from '../models/league-model.js';

class MatchController {
  static async getMatches(request, reply) {
    try {
      let matches = await Match.find();

      const leagueIds = [];
      const homeTeamIds = [];
      const awayTeamIds = [];

      const matchesAsObject = [];

      for (const match of matches) {
        matchesAsObject.push(match.get());
      }

      await Promise.all(matchesAsObject);

      return reply(matchesAsObject);
    } catch (error) {
      console.log(error);
      return reply.badImplementation(error);
    }
  }
}

export default MatchController;
