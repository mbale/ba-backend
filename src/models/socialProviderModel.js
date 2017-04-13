import {
  Model,
  ObjectId,
} from 'mongorito';

class SocialProvider extends Model {
  collection() {
    return 'socialProviders';
  }

  configure() {
    this.before('create', 'cleanUnusedProviders');
  }

  cleanUnusedProviders(next) {
    return SocialProvider
      .remove({
        type: this.get('type'),
        userId: new ObjectId(this.get('userId')),
      })
      .then(() => next);
  }
}

export default SocialProvider;
