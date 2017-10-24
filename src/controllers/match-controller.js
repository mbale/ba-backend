import {
  ObjectId,
} from 'mongorito';
import wiki from 'wikijs';
import EntityNotFoundError from '../errors/entity-not-found-error.js';
import User from '../models/user-model.js';
import Match from '../models/match-model.js';
import Game from '../models/game-model.js';
import League from '../models/league-model.js';
import Team from '../models/team-model.js';

class MatchController {
  static async getMatches(request, reply) {
    try {
      const {
        query: {
          limit,
          game: gameQueryParameter,
          hometeam: homeTeamQueryParameter,
          awayteam: awayTeamQueryParameter,
          league: leagueQueryParameter,
          startdate,
          enddate,
        },
      } = request;

      // default ones
      const andQuery = {
        date: {
          $gte: new Date(startdate),
          $lte: new Date(enddate),
        },
        // 'updates.0': {
        //   $exists: true,
        // },
      };

      let game = null;
      let league = null;
      let homeTeam = null;
      let awayTeam = null;

      if (gameQueryParameter) {
        game = await Game.findOne({
          slug: gameQueryParameter,
        });

        if (!game) {
          throw new EntityNotFoundError('Match', 'game', gameQueryParameter);
        }
      }

      if (leagueQueryParameter) {
        league = await League.findOne({
          name: leagueQueryParameter,
        });

        if (!league) {
          throw new EntityNotFoundError('Match', 'league', leagueQueryParameter);
        }
      }

      if (homeTeamQueryParameter) {
        homeTeam = await Team.findOne({
          name: homeTeamQueryParameter,
        });

        if (!homeTeam) {
          throw new EntityNotFoundError('Match', 'homeTeam', homeTeamQueryParameter);
        }
      }

      if (awayTeamQueryParameter) {
        awayTeam = await Team.findOne({
          name: awayTeamQueryParameter,
        });

        if (!awayTeam) {
          throw new EntityNotFoundError('Match', 'awayTeam', awayTeamQueryParameter);
        }
      }

      if (game) {
        andQuery.gameId = await game.get('_id');
      } else { // we sort out unsupported games (slug === '')
        let gameIdsToExclude = await Game.find({
          slug: '',
        });
        gameIdsToExclude = await Promise.all(gameIdsToExclude.map(gameindb => gameindb.get('_id')));
        andQuery.gameId = {
          $nin: gameIdsToExclude,
        };
      }

      if (homeTeam) {
        andQuery.homeTeamId = new ObjectId(homeTeam.get('_id'));
      }

      if (awayTeam) {
        andQuery.awayTeamId = new ObjectId(await awayTeam.get('_id'));
      }

      if (league) {
        andQuery.leagueId = new ObjectId(await league.get('_id'));
      }

      let matches = await Match
        .limit(limit)
        .where(andQuery)
        .find();

      matches = await Promise.all(matches.map(match => match.get()));
      let matchesAsPromised = [];

      for (const match of matches) {
        const m = [];
        // order is strictly important
        m.push(League.findOne({
          _id: match.leagueId,
        }), Game.findOne({
          _id: match.gameId,
        }), Team.findOne({
          _id: match.homeTeamId,
        }), Team.findOne({
          _id: match.awayTeamId,
        }),
          match.date,
          match.odds,
          match._id,
        );

        // parse date to calculate islive
        const now = new Date();
        const dateOfMatch = new Date(match.date);

        // calculate islive
        let isLive = null;

        if (dateOfMatch.getTime() === now.getTime()) {
          // in playing
          isLive = true;
        } else {
          isLive = false;
        }

        m.push(match.isLive = isLive);

        // add latest known state
        const {
          updates,
        } = match;

        // default state
        const state = {
          scores: null,
          type: null,
        };

        // it can be empty
        if (updates.length !== 0) {
          // order by date
          const orderedUpdates = updates.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
          // then assign state type
          state.type = orderedUpdates[0].statusType;
          if (orderedUpdates[0].statusType === 'Settled') {
            // set scores
            state.scores = {};
            state.scores.homeTeam = orderedUpdates[0].homeTeamScore;
            state.scores.awayTeam = orderedUpdates[0].awayTeamScore;
          }
        }

        m.push(state);

        matchesAsPromised.push(m);
      }


      matchesAsPromised = await Promise.all(matchesAsPromised.map((match => Promise.all(match))));
      matchesAsPromised = matchesAsPromised.map(matchesFragment => ({
        id: matchesFragment[6],
        league: matchesFragment[0].get('name'),
        game: matchesFragment[1].get('name'),
        homeTeam: matchesFragment[2].get('name'),
        awayTeam: matchesFragment[3].get('name'),
        date: matchesFragment[4],
        isLive: matchesFragment[7],
        // odds: matchesFragment[5],
        state: matchesFragment[8],
        gameSlug: matchesFragment[1].get('slug'),
      }));

      return reply(matchesAsPromised);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      }

      return reply.badImplementation(error);
    }
  }

  static async getMatchDetails(request, reply) {
    try {
      let matchId = request.params.matchId;
      matchId = new ObjectId(matchId);

      const match = await Match.findOne({
        _id: matchId,
      });

      if (!match) {
        throw new EntityNotFoundError('match', 'matchId', matchId);
      }

      const {
        updates,
        date,
        odds,
        homeTeamId,
        awayTeamId,
        gameId,
        predictions: _predictions,
      } = await match.get();

      // get team and game details
      const [
        homeTeam,
        awayTeam,
        game,
      ] = await Promise.all([
        Team.findOne({
          _id: homeTeamId,
        }),
        Team.findOne({
          _id: awayTeamId,
        }),
        Game.findOne({
          _id: new ObjectId(gameId),
        }),
        Promise.all(
          _predictions.map(p => User.findOne({
            _id: p.userId,
          })),
        ),
      ]);

      // get predictions
      const predictions = [];

      for (const _prediction of _predictions) {
        let user = await User.findOne({
          _id: _prediction.userId,
        });

        user = await user.getProfile();
        const _odds = odds.find(o => o._id.equals(_prediction.oddsId));

        predictions.push({
          user,
          odds: _odds,
          text: _prediction.text,
          stake: _prediction.stake,
          comments: _prediction.comments,
        });
      }

      const {
        name: homeTeamname,
      } = await homeTeam.get();

      const {
        name: awayTeamname,
      } = await awayTeam.get();

      const {
        slug,
      } = await game.get();

      const latestOdds = [];

      // get odds
      if (odds.length !== 0) {
        const sortedMOdds = odds
          .filter(o => o.type === 'moneyLine')
          .sort((a, b) => new Date(b.fetchedAt) - new Date(a.fetchedAt));
        latestOdds.push(sortedMOdds[0]);
      }

      const matchDetails = {
        date: new Date(date),
        homeTeam: {
          name: homeTeamname,
        },
        awayTeam: {
          name: awayTeamname,
        },
        odds: latestOdds,
      };

      // default state
      const state = {
        scores: null,
        type: null,
      };

      // it can be empty
      if (updates.length !== 0) {
        // order by date
        const orderedUpdates = updates.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
        // then assign state type
        state.type = orderedUpdates[0].statusType;
        if (orderedUpdates[0].statusType === 'Settled') {
          // set scores
          state.scores = {};
          state.scores.homeTeam = orderedUpdates[0].homeTeamScore;
          state.scores.awayTeam = orderedUpdates[0].awayTeamScore;
        }
      }

      matchDetails.state = state;

      matchDetails.predictions = predictions;

      return reply(matchDetails);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error);
      }
      return reply.badImplementation(error);
    }
  }

  static async getPredictionById(request, reply) {
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
        throw new EntityNotFoundError('Match', 'matchId', matchId);
      }

      const predictions = await match.getPredictions();

      return reply({
        count: predictions.length,
        predictions,
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error);
      }
      return reply.badImplementation(error);
    }
  }

  static async addPrediction(request, reply) {
    try {
      const {
        payload: {
          stake,
          text,
        },
        auth: {
          credentials: {
            user,
          },
        },
      } = request;

      const oddsId = new ObjectId(request.payload.oddsId);

      // validate oddsid
      const match = await Match
        .elemMatch('odds', (odds) => {
          odds.where('_id').equals(oddsId);
        })
        .findOne();

      if (!match) {
        throw new EntityNotFoundError('Odds', 'id', oddsId);
      }

      const userId = await user.get('_id');

      const prediction = {
        userId,
        oddsId,
        stake,
        text,
        comments: [],
      };

      await match.addPrediction(prediction);

      return reply();
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error);
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
