import {
  Model,
} from 'mongorito';
import MatchComment from './match-comment-model.js';


class Match extends Model {
  static collection() {
    return 'matches';
  }
}

function extend() {
  Match.embeds('comments', MatchComment);
  return Match;
}

export default extend();
