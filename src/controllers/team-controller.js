import Team from '../models/team-model.js';

class TeamController {
  static async fetchTeams(request, reply) {
    try {
      const teams = await Team.find();

      console.log(await teams[0].get())

      return reply(teams);
    } catch (error) {
      return reply.badImplementation(error);
    }
  }
}

export default TeamController;
