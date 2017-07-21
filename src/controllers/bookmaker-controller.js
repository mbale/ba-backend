import { ObjectId } from 'mongorito';
import timestamps from 'mongorito-timestamps';
import contentfulService from '~/services/contentfulService.js';
import Review from '~/models/review-model.js';
import User from '~/models/user-model.js';
import Utils from '~/utils.js';
import EntityNotFoundError from '~/errors/entity-not-found-error.js';
import SportsbookAlreadyReviewedError from '~/errors/sportsbookAlreadyReviewedError.js';
import SportsbookNotFoundByNameError from '~/errors/sportsbookNotFoundByNameError.js';

export default {
  async getBookmakers(request, reply) {
    try {
      const {
        query: {
          limit,
        },
      } = request;

      const client = await Utils.getContentfulClient();

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

  async getSportsbookBySlug(request, reply) {
    try {
      const {
        params: {
          bookmakerslug: bookmakerSlug,
        },
      } = request;


      const client = await Utils.getContentfulClient();

      const {
        items: bookmakers,
      } = await client.getEntries({
        content_type: 'sportsbook',
        'fields.slug': bookmakerSlug,
      });

      // check if we have results
      if (bookmakers.length === 0) {
        throw new EntityNotFoundError('Bookmaker', 'slug', bookmakerSlug);
      }

      let bookmaker = bookmakers[0];

      const {
        sys: {
          id: bookmakerId,
        },
      } = bookmaker;

      const reviews = await Review.find({
        bookmakerId,
      });

      const reviewsBuffer = [];
      for (const review of reviews) { // eslint-disable-line
        const {
          rate,
          text,
          created_at: createdAt,
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
          createdAt,
        });
      }

      // we strip out meta data
      bookmaker = bookmaker.fields;
      let {
        bonus,
      } = bookmaker;

      // few case it's undefined
      if (bonus && bonus instanceof Array) {
        for (let b of bonus) { // eslint-disable-line
          bonus = b.fields;
        }
      }

      const bm = {};

      // yeah, there's no setter on obj
      // so we redef props
      // note: defsetter's not the best way
      Object.defineProperties(bm, {
        slug: {
          value: bookmaker.slug,
          enumerable: true,
        },
        logo: {
          value: bookmaker.logo.fields.file.url,
          enumerable: true,
        },
        restrictedCountries: {
          value: bookmaker.restrictedCountries,
          enumerable: true,
        },
        description: {
          value: bookmaker.description,
          enumerable: true,
        },
        themeColor: {
          value: bookmaker.themeColor,
          enumerable: true,
        },
        esportsExclusive: {
          value: bookmaker.esportsExclusive,
          enumerable: true,
        },
        url: {
          value: bookmaker.url,
          enumerable: true,
        },
        headQuarters: {
          value: bookmaker.headQuarters,
          enumerable: true,
        },
        founded: {
          value: bookmaker.founded,
          enumerable: true,
        },
        licenses: {
          value: bookmaker.licenses,
          enumerable: true,
        },
        depositMethods: {
          value: bookmaker.depositMethods,
          enumerable: true,
        },
        supportEmail: {
          value: bookmaker.supportEmail,
          enumerable: true,
        },
        icon: {
          value: bookmaker.icon.fields,
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

      return reply(bm);
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
