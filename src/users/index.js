'use strict';

import request from 'superagent';
import jsonValidator from 'simple-json-validator';
import Resource from '../resource';

class Users extends Resource {
  constructor(session) {
    super(session, '/users/:id:')
  }
}

export default Users;
