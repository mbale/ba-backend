import {
  ObjectId,
} from 'mongorito';
import EntityNotFoundError from '../errors/entity-not-found-error.js';
import User from '../models/user-model.js';
import Match from '../models/match-model.js';

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

      const andQuery = {};

      if (gameSlug) {
        andQuery.game.slug = gameSlug;
      }

      if (homeTeamname) {
        andQuery.homeTeam.name = homeTeamname;
      }

      if (awayTeamname) {
        andQuery.awayTeam.name = awayTeamname;
      }

      if (leaguename) {
        andQuery.league.name = leaguename;
      }

      const matches = await Match
        .limit(limit)
        .where({
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .find(andQuery);

      return reply(matches);
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

  static async editMatchComment(request, reply) {
    try {
      let {
        params: {
          matchId,
          commentId,
        },
        payload: {
          text,
        },
      } = request;

      const {
        auth: {
          credentials: {
            user,
          },
        },
      } = request;

      matchId = new ObjectId(matchId);
      commentId = new ObjectId(commentId);

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

      // find the correct comment by id
      const commentToEdit = comments.find(c =>
        // we get by comment id and author id equals to logged user's
        commentId.equals(c._id) && authorId.equals(c.authorId));

      if (!commentToEdit) {
        throw new EntityNotFoundError('Comment', 'id', commentId);
      }

      const indexOfComment = comments.indexOf(commentToEdit);

      // set new text
      comments[indexOfComment].text = text;

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

      // convert
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
