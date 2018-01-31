import { ObjectIdColumn, Entity, ObjectID, Column } from 'typeorm';

export enum SelectedTeam {
  Home = 'home', Away = 'away',
}

interface PredictionComment {
  _id: ObjectID;
  userId : ObjectID;
  text : string;
}

@Entity('predictions')
class Prediction {
  @ObjectIdColumn()
  _id : ObjectID;

  @Column()
  userId : ObjectID;

  @Column()
  matchId : ObjectID;

  @Column()
  oddsId : ObjectID;

  @Column()
  stake : number;

  @Column()
  text : string = '';

  @Column()
  selectedTeam : SelectedTeam;

  @Column()
  comments : PredictionComment[] = [];
}

export default Prediction;
