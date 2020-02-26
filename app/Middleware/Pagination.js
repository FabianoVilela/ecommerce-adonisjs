'use strict';
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Pagination {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle(ctx, next) {
    let method = ctx.request.method();

    if (method === 'GET') {
      const page = ctx.request.input('page')
        ? parseInt(ctx.request.input('page'))
        : 1;
      const limit = ctx.request.input('limit')
        ? parseInt(ctx.request.input('limit'))
        : 20;

      // Set get params to Pagination ctx object properties
      ctx.pagination = {
        page,
        limit,
      };

      const perPage = parseInt(ctx.request.input('perPage'));

      if (perPage) ctx.pagination.limit = perPage;
    }

    await next();
  }
}

module.exports = Pagination;
