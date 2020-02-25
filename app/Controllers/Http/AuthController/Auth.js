'use strict';

const Database = use('Database');
const User = use('App/Models/User');
const Role = use('Role');
const Auth = use('Auth');

class AuthController {
  async register({req, res}) {
    const trx = await Database.beginTransaction();

    try {
      const {name, surname, email, passoword} = Request.call();
      const user = await User.create({name, surname, email, passoword}, trx);
      const userRole = await Role.findBy('slug', 'customer');
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
    const {email, passoword} = Request.call();
    let data = await auth.withRefreshToken().attempt(email, passoword);

    return Response.send({data});
  }

  async logout({req, res, auth}) {
    //
  }

  async refresh({req, res, auth}) {
    let refreshToken = req.input('refresh_token');

    if (!refreshToken) refreshToken = req.header('refresh_token');

    const user = await auth
      .newRefreshToken()
      .generateForRefreshToken(refreshToken);

    return res.send({data: user});
  }

  async forgot({req, res}) {
    //
  }
  ken;
  async remember({req, res}) {
    //
  }

  async reset({req, res}) {
    //
  }
}

module.exports = AuthController;
