'use strict';

class AuthRegister {
  get rules() {
    return {
      name: 'required',
      surname: 'required',
      email: 'required|email|unique:users,email',
      password: 'required|confirmed',
    };
  }

  get messages() {
    return {
      'name.required': 'The name is required!',
      'surname.required': 'Last name is required!',
      'email.required': 'Email is required!',
      'email.email': 'Invalid email!',
      'email.unique': 'This E-mail already exists!',
      'password.required': 'Password is required!',
      'password.confirmed': 'Passwords are not the same!',
    };
  }
}

module.exports = AuthRegister;
