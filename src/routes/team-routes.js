import TeamController from '../controllers/team-controller.js';

const teamRoutes = [{
  path: '/v1/teams',
  method: 'GET',
  handler: TeamController.fetchTeams,
  config: {
    auth: false,
  },
}];

export default teamRoutes;
