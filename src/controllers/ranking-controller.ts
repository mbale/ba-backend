import * as Boom from 'boom';
import * as Hapi from 'hapi';
import * as rabbot from 'rabbot';
import Prediction from '../entity/prediction';
import { endOfMonth, startOfMonth } from 'date-fns';
import { Match } from 'ba-common';
import { ObjectId } from 'mongodb';
import User, { Profile } from './../entity/user';
import {
   getConnection,
} from 'typeorm';

function objectIdWithTimestamp(timestamp) {
  // Convert string date to Date object (otherwise assume timestamp is a date)
  if (typeof(timestamp) === 'string') {
    timestamp = new Date(timestamp);
  }

  // Convert date object to hex seconds since Unix epoch
  const hexSeconds = Math.floor(timestamp / 1000).toString(16);

  // Create an ObjectId with that hex timestamp
  const constructedObjectId = new ObjectId(`${hexSeconds}0000000000000000`);

  return constructedObjectId;
}

interface Ranking {
  user: Profile;
  stats: {
    // all of he did placed in to invest
    in?: number;
    // what he got from this placement
    profit?: number;
    // in what percentage
    yield?: number;
    // profit + in
    overall?: number;
    // how many bet he placed
    betCount?: number;
  };
}

export default class RankingController {
  static async getRankingBoard(request: Hapi.Request, response: Hapi.ReplyNoContinue) {
    try {
      const {
        month,
        overall,
      }: {
        month: number;
        overall?: boolean;
      } = request.query;

      const betRepository = getConnection().getMongoRepository(Prediction);
      const userRepository = getConnection().getMongoRepository(User);

      const now = new Date();

      const intervalQ: {
        $gte?: ObjectId;
        $lte?: ObjectId;
      } = {};

      if (overall) {
        intervalQ.$lte = objectIdWithTimestamp(new Date());
      }

      if (month) {
        intervalQ.$lte = objectIdWithTimestamp(endOfMonth(now.setMonth(month - 1)));
        intervalQ.$gte = objectIdWithTimestamp(startOfMonth(now.setMonth(month - 1)));
      }

      const bets = await betRepository.find({
        where: {
          _id: intervalQ,
        },
      });

      const betsMatchIds = bets.map(b => b.matchId);

      const { ack: matchSRequestAck, body: matchSRequest } = await rabbot.request('match-service', {
        type: 'get-matches-by-ids',
        body: betsMatchIds,
      });

      matchSRequestAck();

      let matches: Match[] = matchSRequest.matches;

      matches = matches.filter(m => m.updates[0]);

      const ranking: Ranking[] = [];

      const getWinnerOfMatch = (match: Match) => {
        const settle = match.updates[0];
        if (settle.homeTeamScore > settle.awayTeamScore) {
          return 'home';
        }
        return 'away';
      };

      const userIdsMapsToResult: {
        userId: ObjectId;
        betIds?: ObjectId[];
        stat: {
          in?: number;
          profit?: number;
          betCount?: number;
        };
      }[] = [];

      // calc1

      bets.forEach(({ _id, userId, matchId, oddsId , selectedTeam, stake }) => {
        const match = matches.find(m => new ObjectId(m._id).equals(matchId));

        if (match) {
          const winnerTeam = getWinnerOfMatch(match);

          // did he choose the good
          if (selectedTeam === winnerTeam) {
            const selectedOdds = match.odds.find(o => new ObjectId(o._id).equals(oddsId));

            const profit = selectedOdds[selectedTeam] * stake;

            const user = userIdsMapsToResult.find(u => u.userId.equals(userId));

            if (user) {
              user.stat.profit += profit;
              user.stat.in += stake;
              user.stat.betCount += 1;
              user.betIds.push(_id);
            } else {
              userIdsMapsToResult.push({
                userId,
                betIds: [_id],
                stat: {
                  profit,
                  in: stake,
                  betCount: 1,
                },
              });
            }
          }
        }
      });

      const userIds = userIdsMapsToResult.map(u => u.userId);
      const betIds = userIdsMapsToResult.map(b => b.betIds);

      const users = await userRepository.findByIds(userIds);

      // calc2
      userIdsMapsToResult.forEach(({ stat, userId }) => {
        const user = users.find(u => new ObjectId(u._id).equals(userId));

        if (user) {
          ranking.push({
            user: user.getProfile(),
            stats: {
              in: stat.in,
              profit: stat.profit,
              overall: stat.in + stat.profit,
              yield: Math.ceil((stat.in / stat.profit) * 100),
              betCount: stat.betCount,
            },
          });
        }
      });

      return response(ranking);
    } catch (error) {
      return response(Boom.badImplementation(error));
    }
  }
}