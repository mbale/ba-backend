import { Request, ReplyNoContinue, Response } from 'hapi';
import { badImplementation, notFound, conflict } from 'boom';
import { ObjectID, getConnection } from 'typeorm';
import { Entry } from 'contentful';
import { MongoRepository } from 'typeorm/repository/MongoRepository';
import User from '../entity/user';
import { getContentfulClient } from '../utils';
import BookmakerReview from '../entity/bookmaker-reviews';
import { EntityNotFoundError, EntityTakenError } from '../errors';

/**
 * Serialize JSON of bookmaker from contentful to object
 *
 * @param {Entry<any>} contentfulItem
 * @returns {BookmakerResponse}
 */
function serializeBookmakerResponse(contentfulItem : Entry<any>) : BookmakerResponse {
  let { bonus } = contentfulItem.fields
  const bonusArray = []
  if (bonus && bonus instanceof Array) {
    bonus.forEach((bonus) => {
      bonusArray.push(bonus.fields)
    })
  }

  return {
    name: contentfulItem.fields.name,
    slug: contentfulItem.fields.slug,
    logo: contentfulItem.fields.logo.fields.file.url,
    icon: contentfulItem.fields.icon.fields.file.url,
    url: contentfulItem.fields.url,
    affiliateUrl: contentfulItem.fields.affiliateUrl,
    description: contentfulItem.fields.description,
    founded: contentfulItem.fields.founded,
    headquarters: contentfulItem.fields.headquarters,
    licenses: contentfulItem.fields.licenses,
    exclusive: contentfulItem.fields.exclusive,
    supportEmail: contentfulItem.fields.supportEmail,
    themeColor: contentfulItem.fields.themeColor,
    depositMethods: contentfulItem.fields.depositMethods.map(x => x.fields),
    restrictedCountries: contentfulItem.fields.restrictedCountries,
    bonuses: bonusArray,
    reviews: {
      avg: 0,
      items: [],
    },
  };
}

/**
 * Aggregate bookmakers from contentful
 *
 * @param {MongoRepository<BookmakerReview>} bookmakerReviewsRepository
 * @param {MongoRepository<User>} userRepository
 * @param {Entry<any>[]} items
 * @returns {Promise<BookmakerResponse[]>}
 */
async function aggregateBookmakers(
  bookmakerReviewsRepository : MongoRepository<BookmakerReview>,
  userRepository : MongoRepository<User>,
  items : Entry<any>[])
  : Promise<BookmakerResponse[]> {
  const bookmakers : BookmakerResponse[] = [];

  for (const item of items) {
    const bookmakerId = item.sys.id;
    const reviewsOfBookmaker : BookmakerReview[] = await bookmakerReviewsRepository.find({
      bookmakerId,
    });

    // return all rate into single array
    const rates = reviewsOfBookmaker.map(review => review.rate);

    let avg = null;
    // sum all of them
    const sum = rates.reduce((sum, rate) => sum += rate, 0); // can be empty initial walue = 0

    // it can be empty
    if (reviewsOfBookmaker.length > 0) {
      avg = sum / reviewsOfBookmaker.length;
    } else {
      avg = sum;
    }

    const reviews = [];

    // partial object construction
    const reviewResponse = {
      avg,
      items: reviews,
    };

    for (const review of reviewsOfBookmaker) {
      const user = await userRepository.findOneById(review.userId);
      const date = review._id.getTimestamp();
      reviewResponse.items.push({
        date,
        rate: review.rate,
        text: review.text,
        user: user.getProfile(),
      });
    }

    const bookmaker : BookmakerResponse = serializeBookmakerResponse(item);

    bookmaker.reviews = reviewResponse,

    bookmakers.push(bookmaker);
  }
  return bookmakers;
}

/**
 * Interface for bookmaker from contentful
 *
 * @interface BookmakerResponse
 */
interface BookmakerResponse {
  name : string;
  slug : string;
  logo : string;
  icon : string;
  url : string;
  affiliateUrl : string;
  description : string;
  founded : Date;
  headquarters : string;
  licenses : string;
  exclusive : boolean;
  themeColor : string;
  supportEmail : string;
  restrictedCountries : string[];
  depositMethods : string[];
  bonuses : string [];
  reviews : {
    avg : number;
    items : object[],
  };
}

class BookmakerController {
  /**
   * List all bookmakers
   *
   * @static
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   * @memberof BookmakerController
   */
  static async getBookmakers(request : Request, reply : ReplyNoContinue) : Promise<Response> {
    try {
      const limit = request.query.limit;

      const bookmakerReviewsRepository = getConnection()
        .getMongoRepository<BookmakerReview>(BookmakerReview);
      const userRepository = getConnection().getMongoRepository<User>(User);

      const client = await getContentfulClient();

      const {
        items,
      } = await client.getEntries({
        limit,
        content_type: 'sportsbook',
      });

      const bookmakers = await aggregateBookmakers(
        bookmakerReviewsRepository,
        userRepository,
        items,
      );

      return reply(bookmakers);
    } catch (error) {
      return reply(badImplementation(error));
    }
  }

  /**
   * Get a bookmaker by slug (from contentful)
   *
   * @static
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   * @memberof BookmakerController
   */
  static async getBookmakerBySlug(request : Request, reply : ReplyNoContinue) : Promise<Response> {
    try {
      const bookmakerSlug = request.params.bookmakerSlug;
      const bookmakerReviewRepository = getConnection()
        .getMongoRepository<BookmakerReview>(BookmakerReview);
      const userRepository = getConnection().getMongoRepository<User>(User);

      const client = await getContentfulClient();

      const {
        items,
      } = await client.getEntries({
        content_type: 'sportsbook',
        'fields.slug': bookmakerSlug,
      });

      if (items.length === 0) {
        throw new EntityNotFoundError('Bookmaker', 'slug', bookmakerSlug);
      }

      const bookmakers = await aggregateBookmakers(
        bookmakerReviewRepository,
        userRepository,
        items,
      );

      return reply(bookmakers[0]);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply(notFound(error.message));
      }
      return reply(badImplementation(error));
    }
  }

  /**
   * Create review for a bookmaker
   *
   * @static
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   * @memberof BookmakerController
   */
  static async createReview(request : Request, reply : ReplyNoContinue) : Promise<Response> {
    try {
      const bookmakerSlug = request.params.bookmakerSlug;
      const {
        rate,
        text,
      } = request.payload;
      const user : User = request.auth.credentials.user;

      const client = await getContentfulClient();
      const bookmakerReviewRepository = getConnection()
        .getMongoRepository<BookmakerReview>(BookmakerReview);
      const userRepository = getConnection().getMongoRepository<User>(User);

      const {
        items,
      } = await client.getEntries({
        content_type: 'sportsbook',
        'fields.slug': bookmakerSlug,
      });

      // correct bookmakerId?
      if (items.length === 0) {
        throw new EntityNotFoundError('Bookmaker', 'slug', bookmakerSlug);
      }

      const bookmakerId = items[0].sys.id;

      // user already has review for bookmaker?
      let review = await bookmakerReviewRepository.findOne({
        bookmakerId,
        userId: user._id,
      });

      if (review) {
        throw new EntityTakenError('BookmakerReview', 'userId', user._id.toString());
      }

      review = new BookmakerReview();

      review.bookmakerId = bookmakerId;
      review.userId = user._id;
      review.rate = rate;
      review.text = text;

      await bookmakerReviewRepository.save(review);

      return reply();
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply(notFound(error.message));
      }
      if (error instanceof EntityTakenError) {
        return reply(conflict(error.message));
      }
      return reply(badImplementation(error));
    }
  }
}

export default BookmakerController;
