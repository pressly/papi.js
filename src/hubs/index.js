'use strict';

import request from 'superagent';
import jsonValidator from 'simple-json-validator';
import Resource from '../resource';

class Hubs extends Resource {
  constructor(session) {
    super(session, '/hubs/:id:')
  }
}

export default Hubs;
