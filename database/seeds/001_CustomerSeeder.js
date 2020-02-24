'use strict';

/*
|--------------------------------------------------------------------------
| CustomerSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory');

const Role = use('Role');
const User = use('App/Models/User');

class CustomerSeeder {
  async run() {
    const role = await Role.findBy('slug', 'customer');
    const customers = await Factory.model('App/Models/User').createMany(30);

    await Promise.all(
      customers.map(async customer => {
        await customer.roles().attach([role.id]);
      }),
    );

    const user = await User.create({
      name: 'John',
      surname: 'Doe',
      email: 'jhon@buymore.com',
      password: 'secret',
    });

    const adminRole = await Role.findBy('slug', 'admin');
    await user.roles().attach([adminRole.id]);
  }
}

module.exports = CustomerSeeder;
