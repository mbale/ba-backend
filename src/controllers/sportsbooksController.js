import { ObjectId } from 'mongorito';
import timestamps from 'mongorito-timestamps';
import contentfulService from '~/services/contentfulService.js';
import Review from '~/models/reviewModel.js';
import User from '~/models/userModel.js';
import SportsbookAlreadyReviewedError from '~/models/errors/sportsbookAlreadyReviewedError.js';
import SportsbookNotFoundByNameError from '~/models/errors/sportsbookNotFoundByNameError.js';

export default {
  async getSportsbooks(request, reply) {
    try {
      const {
        query: {
          limit,
        },
      } = request;

      const client = contentfulService;

      const {
        items: sportsbookCollection,
      } = await client.getEntries({
        content_type: 'sportsbook',
        limit,
      });

      const sportsbookCollectionBuffer = [];

      for (let [index, sportsbook] of Object.entries(sportsbookCollection)) { // eslint-disable-line
        // parse data we need
        const {
          fields: {
            name,
            slug,
            logo,
            icon,
            themeColor,
            restrictedCountries,
          },
        } = sportsbook;

        const sb = {};

        Object.defineProperties(sb, {
          name: {
            value: name,
            enumerable: true,
          },
          slug: {
            value: slug,
            enumerable: true,
          },
          logo: {
            value: logo.fields,
            enumerable: true,
          },
          icon: {
            value: icon.fields,
            enumerable: true,
          },
          themeColor: {
            value: themeColor,
            enumerable: true,
          },
          restrictedCountries: {
            value: restrictedCountries,
            enumerable: true,
          },
        });

        sportsbookCollectionBuffer.push(sb);
      }

      return reply(sportsbookCollectionBuffer);
    } catch (error) {
      return reply.badImplementation(error);
    }
  },

  async getSportsbookByName(request, reply) {
    try {
      let {
        params: {
          sportsbookslug: sportsbookslugToFind,
        },
        server: {
          app: {
            db,
          },
        },
      } = request;

      db.register(Review);
      db.register(User);

      // we make sure it's lowercase cos slug
      sportsbookslugToFind = sportsbookslugToFind.toLowerCase();

      const client = contentfulService;

      const {
        items: sportsbooks,
      } = await client.getEntries({
        content_type: 'sportsbook',
        'fields.slug': sportsbookslugToFind,
      });

      // check if we have results
      if (sportsbooks.length === 0) {
        throw new SportsbookNotFoundByNameError(sportsbookslugToFind);
      }

      let sportsbook = sportsbooks[0];

      const sportsbookId = sportsbook.sys.id;

      const reviews = await Review.find({
        sportsbookId,
      });

      const reviewsBuffer = [];
      for (const review of reviews) { // eslint-disable-line
        const {
          rate,
          text,
          created_at: reviewCreatedAt,
        } = await review.get(); // eslint-disable-line

        let userId = await review.get('userId'); // eslint-disable-line
        userId = new ObjectId(userId);

        let user  = await User.findById(userId) // eslint-disable-line
        const {
          username,
          avatar,
        } = await user.get(); // eslint-disable-line

        reviewsBuffer.push({
          user: {
            username,
            avatar,
          },
          rate,
          text,
          reviewCreatedAt,
        });
      }

      // we strip out meta data
      sportsbook = sportsbook.fields;
      let bonus = sportsbook.bonus;

      // few case it's undefined
      if (bonus && bonus instanceof Array) {
        for (let b of bonus) { // eslint-disable-line
          bonus = b.fields;
        }
      }

      const sb = {};

      // yeah, there's no setter on obj
      // so we redef props
      // note: defsetter's not the best way
      Object.defineProperties(sb, {
        slug: {
          value: sportsbook.slug,
          enumerable: true,
        },
        logo: {
          value: sportsbook.logo.fields.file.url,
          enumerable: true,
        },
        restrictedCountries: {
          value: sportsbook.restrictedCountries,
          enumerable: true,
        },
        description: {
          value: sportsbook.description,
          enumerable: true,
        },
        themeColor: {
          value: sportsbook.themeColor,
          enumerable: true,
        },
        esportsExclusive: {
          value: sportsbook.esportsExclusive,
          enumerable: true,
        },
        url: {
          value: sportsbook.url,
          enumerable: true,
        },
        headQuarters: {
          value: sportsbook.headQuarters,
          enumerable: true,
        },
        founded: {
          value: sportsbook.founded,
          enumerable: true,
        },
        licenses: {
          value: sportsbook.licenses,
          enumerable: true,
        },
        depositMethods: {
          value: sportsbook.depositMethods,
          enumerable: true,
        },
        supportEmail: {
          value: sportsbook.supportEmail,
          enumerable: true,
        },
        icon: {
          value: sportsbook.icon.fields,
          enumerable: true,
        },
        bonus: {
          value: bonus,
          enumerable: true,
        },
        reviews: {
          value: reviewsBuffer,
          enumerable: true,
        },
      });

      return reply(sb);
    } catch (error) {
      if (error instanceof SportsbookNotFoundByNameError) {
        return reply.notFound(error.message);
      }
      return reply.badImplementation(error);
    }
  },

  async getSportsbookReviews(request, reply) {
    try {
      let {
        params: {
          sportsbookslug,
        },
      } = request;
      sportsbookslug = sportsbookslug.toLowerCase();

      const {
        server: {
          app: {
            db,
          },
        },
        query: {
          limit,
        },
      } = request;

      const client = contentfulService;
      db.register(Review);

      // find sportsbook
      const {
        items: sportsbookCollection,
      } = await client.getEntries({
        content_type: 'sportsbook',
        'fields.slug': sportsbookslug,
        limit,
      });

      // check if we've results
      if (sportsbookCollection.length === 0) {
        throw new SportsbookNotFoundByNameError(sportsbookslug);
      }

      const {
        sys: {
          id: sportsbookId,
        },
      } = sportsbookCollection[0];

      const reviews = await Review.limit().find({
        sportsbookId,
      });

      let sum = 0;
      const reviewsBuffer = [];
      for (const review of reviews) { // eslint-disable-line
        const {
          _id: reviewId,
          userId,
          rate,
          text,
          created_at: reviewCreatedAt,
        } = await review.get(); // eslint-disable-line

        // we store it as int but we can't be sure enough
        sum += parseInt(rate, 10);
        reviewsBuffer.push({
          id: reviewId,
          userId,
          rate,
          text,
          createdAt: reviewCreatedAt,
        });
      }

      // it can be null if we do not have reviews
      const avg = sum / reviewsBuffer.length || false;

      // reply automaps entities in array to JSON
      return reply({
        avg,
        reviews: reviewsBuffer,
      });
    } catch (error) {
      if (error instanceof SportsbookNotFoundByNameError) {
        return reply.notFound(error.message);
      }
      return reply.badImplementation(error);
    }
  },

  async addSportsbookReview(request, reply) {
    try {
      let {
        params: {
          sportsbookslug,
        },
      } = request;
      sportsbookslug = sportsbookslug.toLowerCase();

      const {
        server: {
          app: {
            db,
          },
        },
        query: {
          limit,
        },
        payload: {
          rate,
          text,
        },
      } = request;

      let {
        auth: {
          credentials: {
            userId,
          },
        },
      } = request;
      // convert to objectid
      userId = new ObjectId(userId);

      const client = contentfulService;
      db.use(timestamps());
      db.register(User);
      db.register(Review);

      // find user
      const user = await User.findById(userId);

      // find sportsbook
      const {
        items: sportsbookCollection,
      } = await client.getEntries({
        content_type: 'sportsbook',
        'fields.slug': sportsbookslug,
        limit,
      });

      // check if we've results
      if (sportsbookCollection.length === 0) {
        throw new SportsbookNotFoundByNameError(sportsbookslug);
      }

      const {
        sys: {
          id: sportsbookId,
        },
      } = sportsbookCollection[0];

      // we allow one user review per each sportsbook so find
      let review = await Review.findOne({
        userId,
        sportsbookId,
      });

      // if we already have such review
      if (review) {
        throw new SportsbookAlreadyReviewedError(sportsbookId);
      }

      review = new Review({
        userId,
        sportsbookId,
        rate,
        text,
      });

      const {
        id: reviewId, // get saved review from collection
      } = await review.save();
      // save on user too
      await user.addReviewById(reviewId);
      return reply();
    } catch (error) {
      if (error instanceof SportsbookNotFoundByNameError) {
        return reply.notFound(error.message);
      } else if (error instanceof SportsbookAlreadyReviewedError) {
        return reply.conflict(error.message);
      }
      return reply.badImplementation(error);
    }
  },
};
