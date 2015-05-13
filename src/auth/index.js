'use strict';

import request from 'superagent';
import jsonValidator from 'simple-json-validator';
import { authSchemaRequest, authSchemaResponse } from './schema.js';

class Auth {
  constructor(session) {
    this.apiSession = session;
  }

  login(email, password) {
    return new Promise((resolve, reject) => {
      try {
        var payload = { email: email, password: password };

        jsonValidator(payload, authSchemaRequest);

        request
          .post(`${this.apiSession.domain}/login`)
          .set('Content-Type', 'application/json')
          .send(payload)
          .end((err, res) => {
            if (err) {
              return reject(err);
            } else {
              if (res.status == 200) {
                if (!res.body.jwt)
                  throw new Error('Invalid user response - missing jwt');

                this.apiSession.jwt = res.body.jwt;
              }
              resolve(res);
            }
          });
      } catch(err) {
        return reject(err);
      }
    });
  }

  logout() {
    return new Promise((resolve, reject) => {
      request
        .get(`${this.apiSession.domain}/auth/logout`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.apiSession.jwt}`)
        .end((err, res) => {
          if (err) {
            return reject(err);
          }

          if (res.status == 200) {
            this.apiSession.jwt = null;
          }

          resolve(res);
        });
    });
  }

  session() {
    return new Promise((resolve, reject) => {
      try {
        request
          .get(`${this.apiSession.domain}/auth/session`)
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${this.apiSession.jwt}`)
          .end((err, res) => {
            if (err) {
              return reject(err);
            }

            resolve(res);
          });
      } catch(err) {
        return reject(err);
      }
    });
  }
}

export default Auth;
