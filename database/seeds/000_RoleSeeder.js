'use strict';

/*
|--------------------------------------------------------------------------
| RoleSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

const Role = use('Role');
class RoleSeeder {
  async run() {
    await Role.create({
      name: 'Admin',
      slug: 'admin',
      description: 'System administrator',
    });

    await Role.create({
      name: 'Manager',
      slug: 'manager',
      description: 'Shop manager',
    });

    await Role.create({
      name: 'Customer',
      slug: 'customer',
      description: 'Shop customer',
    });
  }
}

module.exports = RoleSeeder;
