import SportsbookModel from '~/models/sportsbookModel.js';

export default {
  getAll(request, reply) {
    return SportsbookModel
      .find()
      .then((sbs) => reply(sbs));
  },

  create(request, reply) {
    const {
      name,
      description,
    } = request.payload;

    const sportsbook = new SportsbookModel({
      name,
      description,
    });

    return sportsbook
      .save()
      .then(() => reply());
  },
};
