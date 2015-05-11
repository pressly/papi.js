'use strict';

//vendor
import request from 'superagent';
import jsonValidator from 'simple-json-validator';

//payload
import { authSchemaRequest, authSchemaResponse } from './schema.js';

class AuthApi {
  constructor(domain) {
    this.domain = domain;
  }

  login(payload) {
    return new Promise((resolve, reject) => {

      try {
        jsonValidator(payload, authSchemaRequest);
      } catch(err) {
        reject(err);
        return;
      }

      request
        .post(`${this.domain}/login`, payload)
        .set('Content-Type', 'application/json')
        .send(payload)
        .end((err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
    });
  }
}

export default AuthApi;
