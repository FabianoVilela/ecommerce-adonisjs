'use strict';

const Database = use('Database');
const User = use('User');
const User = use('Role');

class AuthController {
  async register({req, res}) {
    const trx = await Database.beginTransaction();

    try {
      const {name, surname, email, passoword} = Request.call();
      const user = await User.create({name, surname, email, passoword}, trx);
      const userRole = await userRole.findBy('slug', 'customer');
      await user.roles().attach([userRole.id], null, trx);

      await trx.commit();

      return Response.status(201).send({data: user});
    } catch (error) {
      await trx.rollBack();
      return Response.status(400).send({
        message: 'User register error',
      });
    }
  }

  async login({req, res, auth}) {
    //
  }

  async logout({req, res, auth}) {
    //
  }

  async refresh({req, res, auth}) {
    //
  }

  async forgot({req, res}) {
    //
  }

  async remember({req, res}) {
    //
  }

  async reset({req, res}) {
    //
  }
}

module.exports = AuthController;
