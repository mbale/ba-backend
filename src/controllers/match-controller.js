import {
  ObjectId,
} from 'mongorito';
import EntityNotFoundError from '../errors/entity-not-found-error.js';
import User from '../models/user-model.js';
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

      return reply(getPropsOfEachMatch);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      }

      return reply.badImplementation(error);
    }
  }

  static async getMatchComments(request, reply) {
    try {
      let {
        params: {
          matchId,
        },
      } = request;

      matchId = new ObjectId(matchId);

      const match = await Match.findOne({
        _id: matchId,
      });

      if (!match) {
        throw new EntityNotFoundError('Match', 'id', matchId);
      }

      const comments = await match.getComments();

      // sort out all user info on comments
      await Promise.all(comments.map(async (c) => {
        const comment = c;

        const {
          authorId,
        } = comment;

        const user = await User.findOne({
          _id: authorId,
        });

        const profile = await user.getProfile();
        comment.author = profile;
        delete comment.authorId;
      }));

      const commentsRestructured = [];

      for (const comment of comments) {
        // get fields
        const {
          _id: id,
          author,
          text,
          _createdAt: createdAt,
        } = comment;

        // finale form
        commentsRestructured.push({
          id,
          author,
          text,
          createdAt,
        });
      }

      return reply(commentsRestructured);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      }
      return reply.badImplementation(error);
    }
  }

  static async addMatchComment(request, reply) {
    try {
      const {
        auth: {
          credentials: {
            user,
          },
        },
        payload: {
          text,
        },
      } = request;

      let {
        params: {
          matchId,
        },
      } = request;

      matchId = new ObjectId(matchId);

      // get logged userid and the match as well
      const [
        authorId,
        match,
      ] = await Promise.all([
        user.get('_id'),
        Match.findOne({
          _id: matchId,
        }),
      ]);

      if (!match) {
        throw new EntityNotFoundError('Match', 'id', matchId);
      }

      const comments = await match.getComments();

      // create comment
      const comment = {
        _id: new ObjectId(), // generate id
        authorId,
        text,
        _createdAt: new Date(),
      };

      comments.push(comment);
      await match.save();

      return reply();
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      }
      return reply.badImplementation(error);
    }
  }

  static async removeMatchComment(request, reply) {
    try {
      let {
        params: {
          matchId,
          commentId,
        },
      } = request;

      matchId = new ObjectId(matchId);
      commentId = new ObjectId(commentId);

      const match = await Match.findOne({
        _id: matchId,
      });

      if (!match) {
        throw new EntityNotFoundError('Match', 'id', matchId);
      }

      const comments = await match.getComments();

      // find the correct comment by id
      const commentToDelete = comments.find(c => commentId.equals(c._id));

      if (!commentToDelete) {
        throw new EntityNotFoundError('Comment', 'id', commentId);
      }

      // we get index of comment to delete
      const indexOfComment = comments.indexOf(commentToDelete);
      // remove the comment
      comments.splice(indexOfComment, 1);
      await match.save();

      return reply();
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      }
      return reply.badImplementation(error);
    }
  }
}

export default MatchController;
