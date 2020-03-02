'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Coupon = use('App/Models/Coupon');
const Database = use('Database');
const Service = use('App/Services/Coupon/CouponService');
const Transformer = use('App/Transformers/Admin/CouponTransformer');

/**
 * Resourceful controller for interacting with coupons
 */
class CouponController {
  /**
   * Show a list of all coupons.
   * GET coupons
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {Pagination} ctx.pagination
   * @param {TransformWith} ctx.transform
   */
  async index({request, response, pagination, transform}) {
    const code = request.input('code');
    const query = Coupon.query();

    if (code) query.where('code', 'ILIKE', `%${code}%`);

    let coupons = await query.paginate(pagination.page, pagination.limit);

    return response.send(coupons);
  }

  /**
   * Create/save a new coupon.
   * POST coupons
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformWith} ctx.transform
   */
  async store({request, response, transform}) {
    const trx = await Database.beginTransaction();

    /**
     * 1 - product - can be used only on specific products
     * 2 - customers - can only be used by specific customers
     * 3 - customers and products - can only be used on specific products and customers
     * 4 - can be used by any customer on any order
     */

    let can_use_for = {
      customer: false,
      product: false,
    };

    try {
      const couponData = request.only([
        'code',
        'discount',
        'valid_from',
        'valid_until',
        'quantity',
        'type',
        'recursive',
      ]);

      const {users, products} = request.only(['users', 'products']);
      let coupon = await Coupon.create(couponData, trx);
      const service = new Service(coupon, trx);

      // User relationship
      if (users && users.length > 0) {
        await service.syncUsers(users);
        can_use_for.customer = true;
      }

      if (products && products.length > 0) {
        await service.syncProducts(products);
        can_use_for.product = true;
      }

      if (can_use_for.product && can_use_for.customer)
        coupon.can_use_for = 'product_customer';
      else if (can_use_for.product && !can_use_for.customer)
        coupon.can_use_for = 'product';
      else if (!can_use_for.product && can_use_for.customer)
        coupon.can_use_for = 'customer';
      else coupon.can_use_for = 'all';

      await coupon.save(trx);
      await trx.commit();

      coupon = await transform
        .include('users,products')
        .item(coupon, Transformer);

      return response.status(201).send(coupon);
    } catch (error) {
      await trx.rollback();
      return response.status(400).send({message: 'Error on create coupon!'});
    }
  }

  /**
   * Display a single coupon.
   * GET coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   * @param {TransformWith} ctx.transform
   */
  async show({params: {id}, request, response, transform}) {
    let coupon = await Coupon.findOrFail(id);
    coupon = await transform.item(coupon, Transformer);

    return response.send(coupon);
  }

  /**
   * Update coupon details.
   * PUT or PATCH coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformWith} ctx.transform
   */
  async update({params: {id}, request, response, transform}) {
    const trx = await Database.beginTransaction();
    let coupon = await Coupon.findOrFail(id);
    let can_use_for = {
      customer: false,
      product: false,
    };

    try {
      const couponData = request.only([
        'code',
        'discount',
        'valid_from',
        'valid_until',
        'quantity',
        'type',
        'recursive',
      ]);

      coupon.merge(couponData);

      const {users, products} = request.only(['users', 'products']);
      const service = new Service(coupon, trx);

      if (users && users.length > 0) {
        await service.syncUsers(users);
        can_use_for.customer = true;
      }

      if (products && products.length > 0) can_use_for.product = true;

      if (can_use_for.product && can_use_for.customer)
        coupon.can_use_for = 'product_customer';
      else if (can_use_for.product && !can_use_for.customer)
        coupon.can_use_for = 'product';
      else if (!can_use_for.product && can_use_for.customer)
        coupon.can_use_for = 'customer';
      else coupon.can_use_for = 'all';

      await coupon.save(trx);
      await trx.commit();
      coupon = await transform.item(coupon, Transformer);

      return response.send(coupon);
    } catch (error) {
      await trx.rollback();
      return response.status(400).send({
        message: 'Error on update coupon',
      });
    }
  }

  /**
   * Delete a coupon with id.
   * DELETE coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({params: {id}, request, response}) {
    const trx = await Database.beginTransaction();
    const coupon = await Coupon.findOrFail(id);

    try {
      await coupon.products().detach([], trx);
      await coupon.orders().detach([], trx);
      await coupon.users().detach([], trx);
      await coupon.delete(trx);
      await trx.commit();

      return response.status(204).send();
    } catch (error) {
      await trx.rollback();

      return response.status(400).send({
        message: 'Error on delete coupon',
      });
    }
  }
}

module.exports = CouponController;
