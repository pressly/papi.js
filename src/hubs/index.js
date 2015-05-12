'use strict';

//vendor
import request from 'superagent';
import jsonValidator from 'simple-json-validator';
import Resource from '../resource';

class HubsApi extends Resource {
  constructor(domain) {
    super(domain, '/hubs/:id:')
  }
}

export default HubsApi;
