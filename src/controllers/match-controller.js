import {
  ObjectId,
} from 'mongorito';
import Match from '../models/match-model.js';
import League from '../models/league-model.js';
import Team from '../models/team-model.js';
import Game from '../models/game-model.js';

class MatchController {
  static async getMatches(request, reply) {
    try {
      let matches = await Match.find();

      const leagueIds = [];
      const homeTeamIds = [];
      const awayTeamIds = [];

      const matchesAsObject = [];

      for (const match of matches) { // eslint-disable-line
        console.log(await match.get('_id'))
        let {
          homeTeamId,
          awayTeamId,
          leagueId,
          gameId,
        } = await match.get(); // eslint-disable-line

        homeTeamId = new ObjectId(homeTeamId);
        awayTeamId = new ObjectId(awayTeamId);
        leagueId = new ObjectId(leagueId);
        gameId = new ObjectId(gameId);

        const league = await League.findOne({
          _id: leagueId,
        });

        const homeTeam = await Team.findOne({
          _id: homeTeamId,
        });

        const awayTeam = await Team.findOne({
          _id: awayTeamId,
        });

        const game = await Game.findOne({
          _id: gameId,
        });

        matchesAsObject.push({
          league: await league.get('name'),
          homeTeam: await homeTeam.get('name'),
          awayTeam: await awayTeam.get('name'),
          game: await game.get('name'),
        });
      }

      return reply(matchesAsObject);
    } catch (error) {
      console.log(error);
      return reply.badImplementation(error);
    }
  }
}

export default MatchController;
