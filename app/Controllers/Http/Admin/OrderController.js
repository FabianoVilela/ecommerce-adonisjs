'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Order = use('App/Models/Order');
const Database = use('Database');
const Service = use('App/Services/Order/OrderService');
const Coupon = use('App/Models/Coupon');
const Discount = use('App/Models/Discount');

/**
 * Resourceful controller for interacting with orders
 */
class OrderController {
  /**
   * Show a list of all orders.
   * GET orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {Pagination} ctx.pagination
   */
  async index({request, response, pagination}) {
    const {status, id} = request.only(['status', 'id ']);
    const query = Order.query();

    if (status && id)
      query.where('status', status).orWhere('id', 'ILIKE', `%${id}%`);
    else if (status) query.where('status', status);
    else if (id) query.where('id', 'ILIKE', `%${id}%`);

    const orders = await query.paginate(pagination.page, pagination.limit);

    return response.send(orders);
  }

  /**
   * Create/save a new order.
   * POST orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({request, response}) {
    const trx = await Database.beginTransaction();

    try {
      const {user_id, items, status} = request.all();
      let order = await Order.create({user_id, status}, trx);
      const service = new Service(order, trx);

      if (items && items.length > 0) await service.syncItems(items);

      await trx.commit();

      order = await Order.find(order.id);

      return response.status(201).send(order);
    } catch (error) {
      await trx.rollback();

      return response.status(400).send({
        message: 'Error on order create',
      });
    }
  }

  /**
   * Display a single order.
   * GET orders/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async show({params: {id}, response}) {
    let order = await Order.findOrFail(id);

    return response.send(order);
  }

  /**
   * Update order details.
   * PUT or PATCH orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({params: {id}, request, response}) {
    var order = await Order.findOrFail(id);
    const trx = await Database.beginTransaction();

    try {
      const {user_id, items, status} = request.all();
      order.merge({user_id, status});

      const service = new Service(order, trx);
      await service.updateItems(items);
      await order.save(trx);
      await trx.commit();

      order = await transform
        .include('items,user,discounts,coupons')
        .item(order, Transformer);

      return response.send(order);
    } catch (error) {
      await trx.rollback();
      return response.status(400).send({
        message: 'Error on update order',
      });
    }
  }

  /**
   * Delete a order with id.
   * DELETE orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({params: {id}, request, response}) {
    const order = await Order.findOrFail(id);
    const trx = await Databse.beginTransaction();

    try {
      await order.items().delete(trx);
      await order.coupons().delete(trx);
      await order.delete(trx);
      await trx.commit();

      return response.status(204).send();
    } catch (error) {
      await trx.rollback();

      return response.status(400).send({
        message: 'Error on delete order',
      });
    }
  }
}

module.exports = OrderController;
