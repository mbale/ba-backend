import { ObjectId } from 'mongorito';
import timestamps from 'mongorito-timestamps';
import Review from '~/models/reviewModel.js';
import Sportsbook from '~/models/sportsbookModel.js';
import User from '~/models/userModel.js';
import SportsbookNotFoundByIdError from '~/models/errors/sportsbookNotFoundByIdError.js';
import SportsbookAlreadyReviewedError from '~/models/errors/sportsbookAlreadyReviewedError.js';
import SportsbookNotFoundByNameError from '~/models/errors/sportsbookNotFoundByNameError.js';
import SportsbookNameTakenError from '~/models/errors/sportsbookNameTakenError.js';

export default {
  async getAll(request, reply) {
    const {
      limit = 10,
    } = request.query;

    const db = request.server.app.db;
    db.use(timestamps());
    db.register(Sportsbook);

    try {
      const sportsBooks = await Sportsbook
        .select({ _id: 1, name: 1, description: 1 }) // filtering out fields
        .limit(limit)
        .find();

      const sportsBooksAsJSON = sportsBooks.map(sportsBook => sportsBook.toJSON());
      sportsBooksAsJSON.forEach((sb) => {
        sb.id = sb._id; // eslint-disable-line
        delete sb._id; // eslint-disable-line
      });
      reply(sportsBooksAsJSON);
    } catch (error) {
      reply.badImplementation(error);
    }
  },

  async getByName(request, reply) {
    try {
      const {
        params: {
          sportsbookname: sportsbooknameToFind,
        },
        server: {
          app: {
            db,
          },
        },
      } = request;
      db.register(Sportsbook);

      const sportsbook = await Sportsbook.findOne({
        name: sportsbooknameToFind,
      });

      if (!sportsbook) {
        throw new SportsbookNotFoundByNameError(sportsbooknameToFind);
      }

      const {
        _id: id,
        name,
        description,
      } = await sportsbook.get();

      return reply({
        id,
        name,
        description,
      });
    } catch (error) {
      if (error instanceof SportsbookNotFoundByNameError) {
        return reply.notFound(error.message);
      }
      return reply.badImplementation(error);
    }
  },

  async reviews(request, reply) {
    const {
      limit = 10,
    } = request.query;

    let {
      id: sportsbookId,
    } = request.params;
    sportsbookId = new ObjectId(sportsbookId);

    const db = request.server.app.db;
    db.use(timestamps());
    db.register(Sportsbook);
    db.register(Review);

    const sportsbook = await Sportsbook.findById(sportsbookId);

    if (sportsbook) {
      const reviews = await Review
        .select({ _id: 1, rate: 1, userId: 1, text: 1 }) // filtering out fields
        .limit(limit)
        .find({
          sportsbookId,
        });

      const reviewsAsJSON = reviews.map(review => review.toJSON());
      reviewsAsJSON.forEach((r) => {
        r.id = r._id; // eslint-disable-line
        delete r._id; // eslint-disable-line
      });
      if (reviews.length === 0) {
        return reply([]);
      }
      return reply(reviewsAsJSON);
    }
    return reply.notFound();
  },

  async createReview(request, reply) {
    let {
      id: sportsbookId,
    } = request.params;
    sportsbookId = new ObjectId(sportsbookId);

    let {
      userId,
    } = request.auth.credentials;
    userId = new ObjectId(userId);

    const db = request.server.app.db;
    db.use(timestamps());
    db.register(User);
    db.register(Sportsbook);
    db.register(Review);

    const {
      rate,
      text,
    } = request.payload;

    try {
      const user = await User.findById(userId);
      const sportsbook = await Sportsbook.findById(sportsbookId);
      const review = await Review.findOne({
        userId,
        sportsbookId,
      });

      if (!sportsbook) {
        throw new SportsbookNotFoundByIdError(sportsbookId);
      }

      if (review) {
        throw new SportsbookAlreadyReviewedError(sportsbookId);
      }

      const newReview = new Review({
        userId,
        rate,
        text,
        sportsbookId,
      });

      const {
        id,
      } = await newReview.save();
      await user.addReviewById(id);
      reply();
    } catch (error) {
      if (error instanceof SportsbookNotFoundByIdError) {
        reply.notFound(error.message);
      } else if (error instanceof SportsbookAlreadyReviewedError) {
        reply.conflict(error.message);
      } else {
        reply.badImplementation(error);
      }
    }
  },

  async create(request, reply) {
    try {
      const {
        server: {
          app: {
            db,
          },
        },
        payload: {
          name,
        },
      } = request;

      db.use(timestamps());
      db.register(Sportsbook);

      const {
        id,
      } = await new Sportsbook({
        name,
      }).save();

      return reply({
        id,
      });
    } catch (error) {
      if (error instanceof SportsbookNameTakenError) {
        return reply.conflict(error.message);
      }
      return reply.badImplementation(error);
    }
  },
};
