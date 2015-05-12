'use strict';

//vendor
import request from 'superagent';
import jsonValidator from 'simple-json-validator';
import Resource from '../resource';

class UsersApi extends Resource {
  constructor(domain) {
    super(domain, '/users/:id:')
  }
}

export default UsersApi;
