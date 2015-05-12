'use strict';

//vendor
import request from 'superagent';
import jsonValidator from 'simple-json-validator';

//payload
import { authSchemaRequest, authSchemaResponse } from './schema.js';

class Auth {
  constructor(domain) {
    this.domain = domain;
    this.jwt = null;
    this.currentUser = null;
  }

  login(payload) {
    return new Promise((resolve, reject) => {
      try {
        jsonValidator(payload, authSchemaRequest);

        request
          .post(`${this.domain}/login`, payload)
          .set('Content-Type', 'application/json')
          .send(payload)
          .end((err, res) => {
            if (err) {
              return reject(err);
            } else {
              if (res.status == 200) {
                this.setCurrentUser(res.body);
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
        .get(`${this.domain}/auth/logout`)
        .set('Content-Type', 'application/json')
        .query({ jwt: this.jwt })
        .end((err, res) => {
          if (err) {
            return reject(err);
          }

          if (res.status == 200) {
            this.jwt = null;
            this.currentUser = null;
          }

          resolve(res);
        });
    });
  }

  session() {
    return new Promise((resolve, reject) => {
      try {
        request
          .get(`${this.domain}/auth/session`)
          .set('Content-Type', 'application/json')
          .query({ jwt: this.jwt })
          .end((err, res) => {
            if (err) {
              return reject(err);
            }

            // update currentUser on success
            if (res.status == 200) {
              this.currentUser = res.body;
            }

            resolve(res);
          });
      } catch(err) {
        return reject(err);
      }
    });
  }

  setCurrentUser(user) {
    if (!user.jwt) throw new Error('Invalid user response - missing jwt');
    this.jwt = user.jwt;
    this.currentUser = user;
  }
}

export default Auth;
