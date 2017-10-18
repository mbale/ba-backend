import { ObjectId } from 'mongorito';
import Review from '../models/review-model.js';
import User from '../models/user-model.js';
import Utils from '../utils.js';
import EntityTakenError from '../errors/entity-taken-error';
import EntityNotFoundError from '../errors/entity-not-found-error.js';

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
        items: bookmakerCollection,
      } = await client.getEntries({
        content_type: 'sportsbook',
        limit,
      });

      const bookmakersBuffer = [];

      for (let [index, bookmaker] of Object.entries(bookmakerCollection)) { // eslint-disable-line
        // parse data we need
        const {
          fields: {
            name,
            slug,
            logo,
            icon,
            themeColor,
            depositMethods,
            restrictedCountries,
          },
          sys: {
            id: bookmakerId,
          },
        } = bookmaker;

        // get reviews
        const reviews = await Review.find({ // eslint-disable-line
          bookmakerId,
        });

        const reviewsBuffer = [];

        let sum = 0;

        for (const review of reviews) { // eslint-disable-line
          const {
            rate,
            text,
            _createdAt: createdAt,
          } = await review.get(); // eslint-disable-line

          let userId = await review.get('userId'); // eslint-disable-line
          userId = new ObjectId(userId);

          const user = await User.findById(userId); // eslint-disable-line

          const profile = await user.getProfile(); // eslint-disable-line

          sum += parseInt(rate, 10);

          reviewsBuffer.push({
            user: profile,
            rate,
            text,
            createdAt,
          });
        }

        let avg = null;

        // it can be null if we do not have reviews
        if (reviewsBuffer.length > 0) {
          avg = sum / reviewsBuffer.length;
        } else {
          avg = sum;
        }

        const bm = {};

        Object.defineProperties(bm, {
          name: {
            value: name,
            enumerable: true,
          },
          slug: {
            value: slug,
            enumerable: true,
          },
          logo: {
            value: logo.fields.file.url,
            enumerable: true,
          },
          icon: {
            value: icon.fields.file.url,
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
          depositMethods: {
            value: depositMethods,
            enumerable: true,
          },
          reviews: {
            value: {
              avg,
              items: reviewsBuffer,
            },
            enumerable: true,
          },
        });

        bookmakersBuffer.push(bm);
      }

      return reply(bookmakersBuffer);
    } catch (error) {
      return reply.badImplementation(error);
    }
  },

  async getBookmakerBySlug(request, reply) {
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

      let sum = 0;
      const reviewsBuffer = [];

      for (const review of reviews) { // eslint-disable-line
        const {
          rate,
          text,
          _createdAt: createdAt,
        } = await review.get(); // eslint-disable-line

        let userId = await review.get('userId'); // eslint-disable-line
        userId = new ObjectId(userId);

        const user = await User.findById(userId); // eslint-disable-line

        const profile = await user.getProfile(); // eslint-disable-line

        // we store it as int but we can't be sure enough
        sum += parseInt(rate, 10);

        reviewsBuffer.push({
          user: profile,
          rate,
          text,
          createdAt,
        });
      }

      let avg = null;

      // it can be null if we do not have reviews
      if (reviewsBuffer.length > 0) {
        avg = sum / reviewsBuffer.length;
      } else {
        avg = sum;
      }

      // we strip out meta data
      bookmaker = bookmaker.fields;
      const { bonus } = bookmaker;
      const bonusArray = [];
      // few case it's undefined
      if (bonus && bonus instanceof Array) {
        bonus.forEach((bonus) => {
          bonusArray.push(bonus.fields);
        });
      }

      const bm = {};

      // yeah, there's no setter on obj
      // so we redef props
      // note: defsetter's not the best way
      Object.defineProperties(bm, {
        name: {
          value: bookmaker.name,
          enumerable: true,
        },
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
        headquarters: {
          value: bookmaker.headquarters,
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
        liveSupport: {
          value: bookmaker.liveSupport,
          enumerable: true,
        },
        exclusive: {
          value: bookmaker.exclusive,
          enumerable: true,
        },
        icon: {
          value: bookmaker.icon.fields.file.url,
          enumerable: true,
        },
        bonuses: {
          value: bonusArray,
          enumerable: true,
        },
        reviews: {
          value: {
            avg,
            items: reviewsBuffer,
          },
          enumerable: true,
        },
      });

      return reply(bm);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      }
      return reply.badImplementation(error);
    }
  },

  async getReviews(request, reply) {
    try {
      const {
        params: {
          bookmakerslug: bookmakerSlug,
        },
      } = request;

      const client = await Utils.getContentfulClient();

      // get bookmaker
      const {
        items: bookmakerCollection,
      } = await client.getEntries({
        content_type: 'sportsbook',
        'fields.slug': bookmakerSlug, // by slug
      });

      // check if we've results
      if (bookmakerCollection.length === 0) {
        throw new EntityNotFoundError('Bookmaker', 'slug', bookmakerSlug);
      }

      const {
        sys: {
          id: bookmakerId,
        },
      } = bookmakerCollection[0];

      const reviews = await Review.find({
        bookmakerId,
      });

      let sum = 0;
      const reviewsBuffer = [];

      for (const review of reviews) { // eslint-disable-line
        const {
          _id: id,
          rate,
          text,
          _created_at: createdAt,
        } = await review.get(); // eslint-disable-line

        let userId = await review.get('userId'); // eslint-disable-line
        userId = new ObjectId(userId);

        const user = await User.findById(userId); // eslint-disable-line

        const profile = await user.getProfile(); // eslint-disable-line

        // we store it as int but we can't be sure enough
        sum += parseInt(rate, 10);
        reviewsBuffer.push({
          id,
          user: profile,
          rate,
          text,
          createdAt,
        });
      }

      let avg = null;

      // it can be null if we do not have reviews
      if (reviewsBuffer.length > 0) {
        avg = sum / reviewsBuffer.length;
      } else {
        avg = sum;
      }

      // reply automaps entities in array to JSON
      return reply({
        avg,
        items: reviewsBuffer,
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      }
      return reply.badImplementation(error);
    }
  },

  async addReview(request, reply) {
    try {
      const {
        auth: {
          credentials: {
            user,
          },
        },
        params: {
          bookmakerslug: bookmakerSlug,
        },
        query: {
          limit,
        },
        payload: {
          rate,
          text,
        },
      } = request;

      let userId = await user.get('_id');
      userId = new ObjectId(userId);

      const client = await Utils.getContentfulClient();

      // first we find for bookmaker
      const {
        items: bookmakerCollection,
      } = await client.getEntries({
        content_type: 'sportsbook',
        'fields.slug': bookmakerSlug,
        limit,
      });

      const {
        sys: {
          id: bookmakerId,
        },
      } = bookmakerCollection[0];

      // check if we've results
      if (bookmakerCollection.length === 0) {
        throw new EntityNotFoundError('Bookmaker', 'slug', bookmakerSlug);
      }

      // we allow one review per bookmaker so find
      let review = await Review.findOne({
        userId,
        bookmakerId,
      });

      // if we already have such review
      if (review) {
        throw new EntityTakenError('Review', 'userid', userId);
      }

      review = new Review({
        userId,
        bookmakerId,
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
      if (error instanceof EntityNotFoundError) {
        return reply.notFound(error.message);
      } else if (error instanceof EntityTakenError) {
        return reply.conflict(error.message);
      }
      return reply.badImplementation(error);
    }
  },
};
