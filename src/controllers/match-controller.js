import {
  ObjectId,
} from 'mongorito';
import EntityNotFoundError from '../errors/entity-not-found-error.js';
import Match from '../models/match-model.js';
import League from '../models/league-model.js';
import Team from '../models/team-model.js';
import Game from '../models/game-model.js';

class MatchController {
  static async getMatches(request, reply) {
    try {
      const {
        query: {
          limit,
          game: gameSlug,
          hometeam: homeTeamname,
          awayteam: awayTeamname,
          league: leaguename,
          datefrom: startDate,
          dateto: endDate,
        },
      } = request;

      let gameId = null;
      let homeTeamId = null;
      let awayTeamId = null;
      let leagueId = null;

      if (gameSlug) {
        const game = await Game.findOne({
          slug: gameSlug,
        });

        if (!game) {
          throw new EntityNotFoundError('Game', 'slug', gameSlug);
        }

        gameId = await game.get('_id');
      }

      if (homeTeamname) {
        const homeTeam = await Team.findOne({
          name: homeTeamname,
        });

        if (!homeTeam) {
          throw new EntityNotFoundError('Team', 'name', homeTeamname);
        }

        homeTeamId = await homeTeam.get('_id');
      }

      if (awayTeamname) {
        const awayTeam = await Team.findOne({
          name: awayTeamname,
        });

        if (!awayTeam) {
          throw new EntityNotFoundError('Team', 'name', awayTeamname);
        }

        awayTeamId = await awayTeam.get('_id');
      }

      if (leaguename) {
        const league = await League.findOne({
          name: leaguename,
        });

        if (!league) {
          throw new EntityNotFoundError('League', 'name', leaguename);
        }

        leagueId = await league.get('_id');
      }

      // query building
      const matchQuery = {};

      if (gameId) {
        matchQuery.gameId = new ObjectId(gameId);
      }

      if (homeTeamId) {
        matchQuery.homeTeamId = new ObjectId(homeTeamId);
      }

      if (awayTeamId) {
        matchQuery.awayTeamId = new ObjectId(awayTeamId);
      }

      if (leagueId) {
        matchQuery.leagueId = new ObjectId(leagueId);
      }

      let matches = null;

      matches = await Match.limit(limit)
        .where({
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .find(matchQuery);

      const getPropsOfEachMatch = [];

      for (const match of matches) {
        const {
          _id: id,
          homeTeamId: homeTeamId,
          awayTeamId,
          leagueId,
          gameId,
          date,
        } = await match.get();

        const [
          hometeam,
          awayteam,
          league,
          game,
        ] = await Promise.all([
          Team.findOne({
            _id: new ObjectId(homeTeamId),
          }),
          Team.findOne({
            _id: new ObjectId(awayTeamId),
          }),
          League.findOne({
            _id: new ObjectId(leagueId),
          }),
          Game.findOne({
            _id: new ObjectId(gameId),
          }),
        ]);

        delete match.homeTeamId;
        delete match.awayTeamId;
        delete match.leagueId;
        delete match.gameId;

        getPropsOfEachMatch.push({
          id,
          homeTeam: await hometeam.get('name'),
          awayTeam: await awayteam.get('name'),
          league: await league.get('name'),
          game: await game.get('name'),
          date,
        });
      }

      //matches = await Promise.all([getPropsOfEachMatch]);

      return reply(getPropsOfEachMatch);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      }

      console.log(error.message)
      return reply.badImplementation(error);
    }
  }
}

export default MatchController;
