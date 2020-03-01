'use strict';

const Database = use('Database');

class OrderService {
  constructor(model, trx = fasle) {
    this.model = model;
    this.trx = trx;
  }

  async syncItems(items) {
    if (!Array.isArray(items)) return false;

    await this.model.items().delete(this.trx);
    await this.model.items().createMany(items, this.trx);
  }

  async updateItems(items) {
    let currentItems = await this.model
      .items()
      .whereIn(
        'id',
        items.map(item => item.id),
      )
      .fetch();

    // Delete items
    await this.model
      .items()
      .whereNotIn(
        'id',
        items.map(item => item.id),
      )
      .delete(this.trx);

    // Update price and amount
    await Promise.all(
      currentItems.rows.map(async item => {
        item.fill(items.find(n => n.id === item.id));

        await item.save(this.trx);
      }),
    );
  }

  async canApplyDiscount(coupon) {
    const now = new Date().getTime();

    /**
     * Check if the coupon has already expired
     * Check for an expiration date
     * If there is an expiration date, check if the coupon has expired
     */

    if (
      now > coupon.valid_from.getTime() ||
      (typeof coupon.valid_until == 'object' &&
        coupon.valid_until.getTime() < now)
    )
      return false;

    const couponProducts = await Database.from('coupon_products')
      .where('coupon_id', coupon.id)
      .pluck('product_id');

    const couponCostumers = await Database.from('coupon_user')
      .where('coupon_id', coupon.id)
      .pluck('user_id');

    // Check if the coupon is not associated with specific products and customers
    if (
      Array.isArray(couponProducts) &&
      couponProducts.length < 1 &&
      Array.isArray(couponCostumers) &&
      couponCostumers < 1
    ) {
      // If it is not associated with a specific customer or product, it is free to use
      return true;
    }

    let isAssociatedToProducts,
      isAssociatedToCostumers = false;

    if (Array.isArray(couponProducts) && couponProducts.length > 0)
      isAssociatedToProducts = true;

    if (Array.isArray(couponCostumers) && couponCostumers.length > 0)
      isAssociatedToCostumers = true;

    const productsMatch = await Database.from('order_items')
      .where('order_id', this.model.id)
      .whereIn('product_id', couponProducts)
      .pluck('product_id');

    // Use case 1 - Coupon is associated with customers & products
    if (isAssociatedToCostumers && isAssociatedToProducts) {
      const CostumerMatch = couponCostumers.find(
        costumer => costumer === this.model.user_id,
      );

      if (
        CostumerMatch &&
        Array.isArray(productsMatch) &&
        productsMatch.length > 0
      )
        return true;
    }

    // Use case 2 - coupon is only associated with product
    if (
      isAssociatedToProducts &&
      Array.isArray(productsMatch) &&
      productsMatch.length > 0
    )
      return true;

    // Use case 3 - Coupon is associated with 1 or more customers (and no products)
    if (
      isAssociatedToCostumers &&
      Array.isArray(couponCostumers) &&
      couponCostumers.length > 0
    ) {
      const match = couponCostumers.find(
        costumer => costumer === this.model.user_id,
      );

      if (match) return true;
    }

    /**
     * If none of the above checks are positive
     * then the coupon is associated with customers or products or both
     * however none of the products in this order are eligible for the discount
     * and the customer who made the purchase will also not be able to use this coupon
     */
    return false;
  }
}

module.exports = OrderService;
