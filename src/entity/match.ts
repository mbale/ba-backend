import {
  Entity,
  ObjectIdColumn,
  Column,
  ObjectID,
  BeforeUpdate,
  BeforeInsert,
} from 'typeorm';

enum MapType {
  Match = 'match',
  Map1  = 'map1',
  Map2  = 'map2',
  Map3  = 'map3',
  Map4  = 'map4',
  Map5  = 'map5',
  Map6  = 'map6',
  Map7 = 'map7',
  Unknown = 'unknown',
}

enum statusType {
  Settled = 'settled',
  ReSettled = 'resettled',
  Canceled = 'canceled',
  ReSettleCancelled = 'resettlecancelled',
  Deleted = 'deleted',
  Unknown = 'unknown',
}

interface Update {
  mapType: MapType;
  statusType: statusType;
  endDate: Date;
  homeTeamScore: number;
  awayTeamScore: number;
  addedAt: Date;
}

enum OddsType {
  MoneyLine = 'moneyline',
  Spread = 'spread',
  Total = 'total',
}

interface Odds {
  home: number;
  away: number;
  type: OddsType;
  _id: ObjectID;
}

enum MatchSourceType {
  Pinnacle = 'pinnacle',
  Oddsgg = 'oddsgg',
}

interface MatchSource {
  type: MatchSourceType;
  leagueId: number;
  matchId: number;
  fetchedAt: Date;
}

@Entity('matches')
export class Match {
  @ObjectIdColumn()
  _id : ObjectID;

  @Column()
  gameId: ObjectID;

  @Column()
  leagueId: ObjectID;

  @Column()
  homeTeamId: ObjectID;

  @Column()
  awayTeamId: ObjectID;

  @Column()
  date: Date;

  @Column()
  odds: Odds[];

  @Column()
  updates: Update[];
}

export default Match​​;
