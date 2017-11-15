import { getContentfulClient } from '../utils';
import { Request, ReplyNoContinue, Response } from 'hapi';
import { badImplementation, notFound } from 'boom';
import { Entry } from 'contentful';
import { EntityNotFoundError } from '../errors';

/**
 * Interface for guide from contentful
 * 
 * @interface GuideResponse
 */
interface GuideResponse {
  title : string;
  text : string;
  slug : string;
  headerImage : string;
  cardImage : string;
  cardText : string;
}

/**
 * Serialize JSON response for guides to object
 * 
 * @param {Entry<any>} contentfulItem 
 * @returns {GuideResponse} 
 */
function serializeGuideResponse(contentfulItem : Entry<any>) : GuideResponse {
  return {
    title: contentfulItem.fields.title,
    text: contentfulItem.fields.text,
    slug: contentfulItem.fields.slug,
    headerImage: contentfulItem.fields.headerImage.fields.file.url,
    cardText: contentfulItem.fields.cardText,
    cardImage: contentfulItem.fields.cardImage.fields.file.url,
  };
}

class GuideController {
  /**
   * Get all guides from contentful
   * 
   * @static
   * @param {Request} request 
   * @param {ReplyNoContinue} reply 
   * @returns {Promise<Response>} 
   * @memberof GuideController
   */
  static async getGuides(request : Request, reply : ReplyNoContinue) : Promise<Response> {
    try {
      const client = await getContentfulClient();

      const { items } = await client.getEntries({
        content_type: 'guide',
      });

      const guides : GuideResponse[] = [];

      for (const item of items) {
        const guide = serializeGuideResponse(item);
        guides.push(guide);
      }

      return reply(guides);
    } catch (error) {
      return reply(badImplementation(error));
    }
  }

  static async getGuideBySlug(request : Request, reply : ReplyNoContinue) : Promise<Response> {
    try {
      const guideSlug = request.params.guideSlug;

      const client = await getContentfulClient();

      const { items } = await client.getEntries({
        content_type: 'guide',
        'fields.slug': guideSlug,
      });

      if (items.length === 0) {
        throw new EntityNotFoundError('Guide', 'slug', guideSlug);
      }

      const guide = serializeGuideResponse(items[0]);

      return reply(guide);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return reply(notFound(error.message));
      }
      return reply(badImplementation(error));
    }
  }
}

export default GuideController;
