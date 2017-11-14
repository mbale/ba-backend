import User from '../entity/user';
import { getContentfulClient } from '../utils';
import { Request, ReplyNoContinue, Response } from 'hapi';
import { badImplementation } from 'boom';
import { badImplementation, notFound } from 'boom';
import { ObjectID, getConnection } from 'typeorm';
import BookmakerReview from '../entity/bookmaker-reviews';
import { EntityNotFoundError } from '../errors';
import { Entry } from 'contentful';
import { MongoRepository } from 'typeorm/repository/MongoRepository';

/**
 * Serialize JSON of bookmaker from contentful to object
 * 
 * @param {Entry<any>} contentfulItem 
 * @returns {BookmakerResponse} 
 */
function serializeBookmakerResponse(contentfulItem : Entry<any>) : BookmakerResponse {
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
    licenses: contentfulItem.fields.licenses[0],
    exclusive: contentfulItem.fields.exclusive,
    supportEmail: contentfulItem.fields.supportEmail,
    themeColor: contentfulItem.fields.themeColor,
    depositMethods: contentfulItem.fields.depositMethods.map(x => x.fields.slug),
    restrictedCountries: contentfulItem.fields.restrictedCountries,
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
      reviewResponse.items.push({
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
}

export default BookmakerController;

// export default {


//   async getBookmakerBySlug(request, reply) {
//     try {
//       const {
//         params: {
//           bookmakerslug: bookmakerSlug,
//         },
//       } = request;


//       const client = await Utils.getContentfulClient();

//       const {
//         items: bookmakers,
//       } = await client.getEntries({
//         content_type: 'sportsbook',
//         'fields.slug': bookmakerSlug,
//       });

//       // check if we have results
//       if (bookmakers.length === 0) {
//         throw new EntityNotFoundError('Bookmaker', 'slug', bookmakerSlug);
//       }

//       let bookmaker = bookmakers[0];

//       const {
//         sys: {
//           id: bookmakerId,
//         },
//       } = bookmaker;

//       const reviews = await Review.find({
//         bookmakerId,
//       });

//       let sum = 0;
//       const reviewsBuffer = [];

//       for (const review of reviews) { // eslint-disable-line
//         const {
//           rate,
//           text,
//           _createdAt: createdAt,
//         } = await review.get(); // eslint-disable-line

//         let userId = await review.get('userId'); // eslint-disable-line
//         userId = new ObjectId(userId);

//         const user = await User.findById(userId); // eslint-disable-line

//         const profile = await user.getProfile(); // eslint-disable-line

//         // we store it as int but we can't be sure enough
//         sum += parseInt(rate, 10);

//         reviewsBuffer.push({
//           user: profile,
//           rate,
//           text,
//           createdAt,
//         });
//       }

//       let avg = null;

//       // it can be null if we do not have reviews
//       if (reviewsBuffer.length > 0) {
//         avg = sum / reviewsBuffer.length;
//       } else {
//         avg = sum;
//       }

//       // we strip out meta data
//       bookmaker = bookmaker.fields;
//       const { bonus } = bookmaker;
//       const bonusArray = [];
//       // few case it's undefined
//       if (bonus && bonus instanceof Array) {
//         bonus.forEach((bonus) => {
//           bonusArray.push(bonus.fields);
//         });
//       }

//       const bm = {};

//       // yeah, there's no setter on obj
//       // so we redef props
//       // note: defsetter's not the best way
//       Object.defineProperties(bm, {
//         name: {
//           value: bookmaker.name,
//           enumerable: true,
//         },
//         slug: {
//           value: bookmaker.slug,
//           enumerable: true,
//         },
//         logo: {
//           value: bookmaker.logo.fields.file.url,
//           enumerable: true,
//         },
//         restrictedCountries: {
//           value: bookmaker.restrictedCountries,
//           enumerable: true,
//         },
//         description: {
//           value: bookmaker.description,
//           enumerable: true,
//         },
//         themeColor: {
//           value: bookmaker.themeColor,
//           enumerable: true,
//         },
//         esportsExclusive: {
//           value: bookmaker.esportsExclusive,
//           enumerable: true,
//         },
//         url: {
//           value: bookmaker.url,
//           enumerable: true,
//         },
//         headquarters: {
//           value: bookmaker.headquarters,
//           enumerable: true,
//         },
//         founded: {
//           value: bookmaker.founded,
//           enumerable: true,
//         },
//         licenses: {
//           value: bookmaker.licenses,
//           enumerable: true,
//         },
//         depositMethods: {
//           value: bookmaker.depositMethods,
//           enumerable: true,
//         },
//         supportEmail: {
//           value: bookmaker.supportEmail,
//           enumerable: true,
//         },
//         liveSupport: {
//           value: bookmaker.liveSupport,
//           enumerable: true,
//         },
//         exclusive: {
//           value: bookmaker.exclusive,
//           enumerable: true,
//         },
//         icon: {
//           value: bookmaker.icon.fields.file.url,
//           enumerable: true,
//         },
//         bonuses: {
//           value: bonusArray,
//           enumerable: true,
//         },
//         reviews: {
//           value: {
//             avg,
//             items: reviewsBuffer,
//           },
//           enumerable: true,
//         },
//       });

//       return reply(bm);
//     } catch (error) {
//       if (error instanceof EntityNotFoundError) {
//         return reply.notFound(error.message);
//       }
//       return reply.badImplementation(error);
//     }
//   },

//   async getReviews(request, reply) {
//     try {
//       const {
//         params: {
//           bookmakerslug: bookmakerSlug,
//         },
//       } = request;

//       const client = await Utils.getContentfulClient();

//       // get bookmaker
//       const {
//         items: bookmakerCollection,
//       } = await client.getEntries({
//         content_type: 'sportsbook',
//         'fields.slug': bookmakerSlug, // by slug
//       });

//       // check if we've results
//       if (bookmakerCollection.length === 0) {
//         throw new EntityNotFoundError('Bookmaker', 'slug', bookmakerSlug);
//       }

//       const {
//         sys: {
//           id: bookmakerId,
//         },
//       } = bookmakerCollection[0];

//       const reviews = await Review.find({
//         bookmakerId,
//       });

//       let sum = 0;
//       const reviewsBuffer = [];

//       for (const review of reviews) { // eslint-disable-line
//         const {
//           _id: id,
//           rate,
//           text,
//           _created_at: createdAt,
//         } = await review.get(); // eslint-disable-line

//         let userId = await review.get('userId'); // eslint-disable-line
//         userId = new ObjectId(userId);

//         const user = await User.findById(userId); // eslint-disable-line

//         const profile = await user.getProfile(); // eslint-disable-line

//         // we store it as int but we can't be sure enough
//         sum += parseInt(rate, 10);
//         reviewsBuffer.push({
//           id,
//           user: profile,
//           rate,
//           text,
//           createdAt,
//         });
//       }

//       let avg = null;

//       // it can be null if we do not have reviews
//       if (reviewsBuffer.length > 0) {
//         avg = sum / reviewsBuffer.length;
//       } else {
//         avg = sum;
//       }

//       // reply automaps entities in array to JSON
//       return reply({
//         avg,
//         items: reviewsBuffer,
//       });
//     } catch (error) {
//       if (error instanceof EntityNotFoundError) {
//         return reply.notFound(error.message);
//       }
//       return reply.badImplementation(error);
//     }
//   },

//   async addReview(request, reply) {
//     try {
//       const {
//         auth: {
//           credentials: {
//             user,
//           },
//         },
//         params: {
//           bookmakerslug: bookmakerSlug,
//         },
//         query: {
//           limit,
//         },
//         payload: {
//           rate,
//           text,
//         },
//       } = request;

//       let userId = await user.get('_id');
//       userId = new ObjectId(userId);

//       const client = await Utils.getContentfulClient();

//       // first we find for bookmaker
//       const {
//         items: bookmakerCollection,
//       } = await client.getEntries({
//         content_type: 'sportsbook',
//         'fields.slug': bookmakerSlug,
//         limit,
//       });

//       const {
//         sys: {
//           id: bookmakerId,
//         },
//       } = bookmakerCollection[0];

//       // check if we've results
//       if (bookmakerCollection.length === 0) {
//         throw new EntityNotFoundError('Bookmaker', 'slug', bookmakerSlug);
//       }

//       // we allow one review per bookmaker so find
//       let review = await Review.findOne({
//         userId,
//         bookmakerId,
//       });

//       // if we already have such review
//       if (review) {
//         throw new EntityTakenError('Review', 'userid', userId);
//       }

//       review = new Review({
//         userId,
//         bookmakerId,
//         rate,
//         text,
//       });

//       const {
//         id: reviewId, // get saved review from collection
//       } = await review.save();
//       // save on user too
//       await user.addReviewById(reviewId);
//       return reply();
//     } catch (error) {
//       if (error instanceof EntityNotFoundError) {
//         return reply.notFound(error.message);
//       } else if (error instanceof EntityTakenError) {
//         return reply.conflict(error.message);
//       }
//       return reply.badImplementation(error);
//     }
//   },
// };
