import {
  Model,
} from 'mongorito';

class Match extends Model {
  static collection() {
    return 'matches';
  }
}

const methods = (matchModel) => {
  const MatchModel = matchModel;

  MatchModel.prototype.getComments = async function getComments() {
    try {
      // get comments field
      let comments = await this.get('comments');

      // set to empty array if undefined
      if (!comments) {
        await this.set('comments', []);
      }

      comments = this.get('comments');

      // return model back
      return comments;
    } catch (error) {
      throw error;
    }
  };

  MatchModel.prototype.getPredictions = async function getPredictions() {
    try {
      const predictions = await this.get('predictions') || [];

      return predictions;
    } catch (error) {
      throw error;
    }
  };
};

function extend() {
  Match.use(methods);
  return Match;
}

export default extend();
