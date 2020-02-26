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
  async handle({request}, next) {
    if (ctx.request.method() == 'GET') {
      const page = parseInt(ctx.request.input('page'));
      const limit = parseInt(ctx.request.input('limit'));
      const perPage = parseInt(ctx.request.input('perPage'));

      // Set get params to Pagination ctx object properties
      ctx.pagination = {
        page,
        limit,
      };

      if (perPage) ctx.pagination.limit = perPage;
    }

    await next();
  }
}

module.exports = Pagination;
