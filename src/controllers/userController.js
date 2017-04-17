import UserModel from '~/models/userModel.js';
import UserReviewModel from '~/models/userReviewModel.js';
import SportsbookModel from '~/models/sportsbookModel.js';
import {
  ObjectId,
} from 'mongorito';
import _ from 'lodash';
import Promise from 'bluebird';

export default {
  getInfo(request, reply) {
    const userId = request.auth.credentials.userId;

    const excludedProps = ['_id', 'password', '_version',
      'accessToken', 'recoveryHash', 'steamProvider', 'reviews', 'created_at', 'updated_at'];

    return UserModel
      .exclude(excludedProps)
      .findById(userId)
      .then(user => reply(user));
  },

  getSteamInfo(request, reply) {
    const userId = request.auth.credentials.userId;

    const pickedProps = ['personaName', 'profileurl'];

    return UserModel
      .findById(userId)
      .then((user) => {
        const steamData = user.toJSON().steamProvider;

        if (!steamData) {
          return reply.notFound('user\'s not authenticated with steam');
        }
        // camelcase convention
        steamData.profileurl = steamData.profileurl;
        steamData.personaName = steamData.personaname;

        const stripedResponse = _.pick(steamData, pickedProps);
        return reply(stripedResponse);
      });
  },

  getReviews(request, reply) {
    const userId = request.auth.credentials.userId;

    return UserModel
      .populate('reviews', UserReviewModel)
      .findById(userId)
      .then((user) => {
        return reply(user.get('reviews'));
      });
  },

  createReview(request, reply) {
    const userId = new ObjectId(request.auth.credentials.userId);

    const {
      sportsbookId: _sportsbookId,
      score,
      text,
    } = request.payload;

    const sportsbookId = new ObjectId(_sportsbookId);
    const review = {
      score,
      sportsbookId: new ObjectId(sportsbookId),
      userId,
    };

    if (text) {
      review.text = text;
    }

    const validate = ([sportsbook, user, review]) => {
      if (!sportsbook) {
        return Promise.reject({
          code: 0,
        });
      }

      if (!user) {
        return Promise.reject({
          code: 1,
        });
      }

      if (review) {
        return Promise.reject({
          code: 2,
        });
      }

      return user;
    };

    const saveReview = (user) => {
      const newReview = new UserReviewModel(review);

      return Promise.all([user, newReview.save()]);
    };

    const addToUser = ([user, review]) => {
      const userReviews = user.get('reviews') || [];

      userReviews.push(review.get('_id'));
      user.set('reviews', userReviews);

      return user.save();
    };

    const successHandler = user => reply();

    const errorHandler = (error) => {
      switch (error.code) {
      case 0:
        reply.badRequest('invalid sportsbookid');
        break;
      case 1:
        reply.unauthorized();
        break;
      case 2:
        reply.conflict('you\'ve already rated');
        break;
      default:
        reply.badImplementation(error);
      }
    };

    return Promise
      .all([
        SportsbookModel.findById(sportsbookId),
        UserModel.findById(userId),
        UserReviewModel.findOne({
          userId,
          sportsbookId,
        }),
      ])
      .then(validate)
      .then(saveReview)
      .then(addToUser)
      .then(successHandler)
      .catch(errorHandler);
  },
};
