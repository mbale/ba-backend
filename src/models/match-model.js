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
      const comments = await this.get('comments') || [];

      // return model back
      return comments;
    } catch (error) {
      throw error;
    }
  };

  MatchModel.prototype.addPrediction = async function addPrediction(prediction) {
    try {
      const predictions = await this.get('predictions') || [];

      predictions.push(prediction);
      await this.set('predictions', predictions);

      await this.save();
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
