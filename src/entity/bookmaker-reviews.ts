import { ObjectIdColumn, Entity, ObjectID, Column } from 'typeorm';

@Entity('bookmaker-reviews')
class BookmakerReview {
  @ObjectIdColumn()
  _id : ObjectID;

  @Column()
  userId : ObjectID;
  
  @Column()
  bookmakerId : string;

  @Column()
  rate : number;

  @Column()
  text : string = '';
}

export default BookmakerReview;
