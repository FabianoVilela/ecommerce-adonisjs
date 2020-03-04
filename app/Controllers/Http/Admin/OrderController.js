'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Order = use('App/Models/Order');
const Database = use('Database');
const Service = use('App/Services/Order/OrderService');
const Coupon = use('App/Models/Coupon');
const Discount = use('App/Models/Discount');
const Transformer = use('App/Transformers/Admin/OrderTransformer');

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
   * @param {TransformWith} ctx.transform
   */
  async index({request, response, pagination, transform}) {
    const {status, id} = request.only(['status', 'id ']);
    const query = Order.query();

    if (status && id)
      query.where('status', status).orWhere('id', 'ILIKE', `%${id}%`);
    else if (status) query.where('status', status);
    else if (id) query.where('id', 'ILIKE', `%${id}%`);

    let orders = await query.paginate(pagination.page, pagination.limit);
    orders = await transform.paginate(orders, Transformer);

    return response.send(orders);
  }

  /**
   * Create/save a new order.
   * POST orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformWith} ctx.transform
   */
  async store({request, response, transform}) {
    const trx = await Database.beginTransaction();

    try {
      const {user_id, items, status} = request.all();
      let order = await Order.create({user_id, status}, trx);
      const service = new Service(order, trx);

      if (items && items.length > 0) await service.syncItems(items);

      await trx.commit();

      order = await Order.find(order.id);
      order = await transform.include('user, items').item(order, Transformer);

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
   * @param {TransformWith} ctx.transform
   */
  async show({params: {id}, response, transform}) {
    let order = await Order.findOrFail(id);
    order = await transform
      .include('user, items, discounts')
      .item(order, Transformer);

    return response.send(order);
  }

  /**
   * Update order details.
   * PUT or PATCH orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformWith} ctx.transform
   */
  async update({params: {id}, request, response, transform}) {
    let order = await Order.findOrFail(id);
    const trx = await Database.beginTransaction();

    try {
      const {user_id, items, status} = request.all();
      order.merge({user_id, status});

      const service = new Service(order, trx);
      await service.updateItems(items);
      await order.save(trx);
      await trx.commit();

      order = await transform
        .include('items, user, discounts, coupons')
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

  async applyDiscount({params: {id}, request, response}) {
    const {code} = request.all();
    const coupon = await Coupon.findByOrFail('code', code.toUpperCase());
    let order = await Order.findOrFail(id);
    let discount,
      info = {};

    try {
      const service = new Service(order);
      const canAddDiscount = await service.canApplyDiscount(coupon);
      const orderDiscounts = await order.coupons().getCount();

      const cannApplyToOrder =
        orderDiscounts < 1 || (orderDiscounts >= 1 && coupon.recursive);

      if (canAddDiscount && cannApplyToOrder) {
        discount = await Discount.findOrCreate({
          order_id: order.id,
          coupon_id: coupon.id,
        });

        info.message = 'Coupon successfully applied!';
        info.success = true;
      } else {
        info.message = 'This coupon could not be applied!';
        info.success = false;
      }
      order = await transform
        .include('items,user,discounts,coupons')
        .item(order, Transformer);

      return response.send({order, info});
    } catch (error) {
      return response.status(400).send({message: 'Error on apply coupon'});
    }
  }
}

module.exports = OrderController;
