'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const User = use('App/Models/User');
const Transformer = use('App/Transformers/Admin/UserTransformer');

/**
 * Resourceful controller for interacting with users
 */
class UserController {
  /**
   * Show a list of all users.
   * GET users
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {Pagination} ctx.pagination
   * @param {TransformWith} ctx.transform
   */
  async index({request, response, pagination, transform}) {
    const name = request.input('name');
    const query = User.query();

    if (name) {
      query.where('name', 'ILIKE', `%${name}%`);
      query.orWhere('surname', 'ILIKE', `%${name}%`);
      query.orWhere('email', 'ILIKE', `%${name}%`);
    }

    let users = await query.paginate(pagination.page, pagination.limit);
    users = await transform.paginate(users, Transformer);

    return response.send(users);
  }

  /**
   * Create/save a new user.
   * POST users
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformWith} ctx.transform
   */
  async store({request, response, transform}) {
    try {
      const userData = request.only([
        'name',
        'surname',
        'email',
        'password',
        'image_id',
      ]);

      let user = await User.create(userData);
      user = await transform.item(user, Transformer);

      return response.status(201).send(user);
    } catch (error) {
      return response.status(400);
    }
  }

  /**
   * Display a single user.
   * GET users/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformWith} ctx.transform
   */
  async show({params: {id}, request, response, transform}) {
    let user = await User.findOrFail(id);
    user = await transform.item(user, Transformer);

    return response.send(user);
  }

  /**
   * Update user details.
   * PUT or PATCH users/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformWith} ctx.transform
   */
  async update({params: {id}, request, response, transform}) {
    try {
      let user = await User.findOrFail(id);
      const userData = request.only([
        'name',
        'surname',
        'email',
        'password',
        'image_id',
      ]);

      user.merge(userData);
      await user.save();

      user = await transform.item(user, Transformer);

      return response.send(user);
    } catch (error) {
      return response.status(400);
    }
  }

  /**
   * Delete a user with id.
   * DELETE users/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({params: {id}, request, response}) {
    try {
      const user = await User.findOrFail(id);
      await user.delete();

      return response.status(204).send();
    } catch (error) {
      return response.status(400);
    }
  }
}

module.exports = UserController;
