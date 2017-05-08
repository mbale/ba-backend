import Sportsbook from '~/models/sportsbookModel.js';
import UserReview from '~/models/userReviewModel.js';
import { ObjectId } from 'mongorito';
import Promise from 'bluebird';

export default {
  getAll(request, reply) {
    const {
      limit,
    } = request.query;

    const db = request.server.app.db;
    db.register(Sportsbook);

    const excludedProps = ['created_at', 'updated_at'];

    return Sportsbook
      .exclude(excludedProps)
      .limit(limit)
      .find()
      .then(sbs => reply(sbs));
  },

  reviews(request, reply) {
    const {
      query: {
        limit,
      },
      params: {
        id: _id,
      },
    } = request;

    const db = request.server.app.db;
    db.register(UserReview);
    db.register(Sportsbook);

    const excludedProps = ['created_at', 'updated_at', 'sportsbookId'];

    const id = new ObjectId(_id);

    const successHandler = reviews => reply(reviews);

    const errorHandler = (error) => {
      switch (error.code) {
      case 0:
        reply.notFound(`there's no sportsbook with id: ${error.data}`);
        break;
      default:
        reply.badImplementation(error);
      }
    };

    return Promise
      .all([UserReview
        .exclude(excludedProps)
        .limit(limit)
        .find({
          sportsbookId: id,
        }), Sportsbook.findById(id)])
      .then(([reviews, sb]) => {
        if (!sb) {
          return Promise.reject({
            code: 0,
            data: id,
          });
        }
        return reviews;
      })
      .then(successHandler)
      .catch(errorHandler);
  },

  create(request, reply) {
    const {
      name,
      description,
    } = request.payload;

    const db = request.server.app.db;
    db.register(Sportsbook);

    const sportsbook = new Sportsbook({
      name,
      description,
    });

    return sportsbook
      .save()
      .then(() => reply());
  },
};
