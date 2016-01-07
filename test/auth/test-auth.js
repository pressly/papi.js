'use strict';

import mockRequest from '../../lib/mock-request';
//import nock from 'nock';  // Needs to be imported first before papi because it overrides http and so does node-fetch

import Papi from '../../src';
import * as mock from './mocks';
import should from 'should';

const api = new Papi();

mockRequest.configure({host: api.options.host});

// interceptors
// var mockRequest = nock(api.options.host);
//
// mockRequest.post('/auth/login', { email: 'incorrect-email', password: 'incorrect-password', }).reply(401)
// mockRequest.post('/auth/login', { email: mock.session.email, password: mock.session.password }).times(3).reply(200, mock.session);
//
// mockRequest.delete('/session').reply(200)
// mockRequest.get('/session').times(2).reply(function() {
//   if (api.auth.session) {
//     return [200, mock.session];
//   }
//
//   return [401, null];
// })
//
// clear outstanding interceptors
// after(function() {
//   nock.cleanAll();
// });

describe('Auth', function () {
  describe('Login', function() {
    it('should return 401 when given incorrect email or password', function (done) {
      mockRequest.post('/auth/login', { email: 'incorrect-email', password: 'incorrect-password', }).reply(401);

      api.auth.login('incorrect-email', 'incorrect-password').then(() => {
        throw new Error('login was successfull');
      }).catch((err) => {
        if (err.status == 401) {
          return done();
        }

        done(err);
      });
    });

    it('should return 200 with proper email and password', function (done) {
      mockRequest.post('/auth/login', { email: mock.session.email, password: mock.session.password }).reply(200, mock.session);

      api.auth.login('alex.vitiuk@pressly.com', 'betame').then((res) => {
        res.id.should.be.exactly(mock.session.id);
        res.jwt.should.be.exactly(mock.session.jwt);
        res.email.should.be.exactly(mock.session.email);
        res.username.should.be.exactly(mock.session.username);
        res.account_id.should.not.be.empty;

        done();
      }).catch((err) => {
        done(err);
      });
    });

    it('should set jwt', function (done) {
      mockRequest.post('/auth/login', { email: mock.session.email, password: mock.session.password }).reply(200, mock.session);

      api.auth.login('alex.vitiuk@pressly.com', 'betame').then((res) => {
        if (!api.auth.session.jwt) {
          throw new Error('jwt was not set');
        }

        done()
      }).catch((err) => {
        done(err)
      });
    });
  });

  describe('Logout', function () {
    it('should logout user', function (done) {
      mockRequest.delete('/session').reply(200);

      api.auth.logout().then((res) => {
        if (res.status != 200) {
          throw new Error('logout unsuccessful');
        }
        done()
      }).catch((err) => {
        done(err);
      });
    });

    it('should clear session', function (done) {
      if (api.auth.session) {
        throw new Error('logout didnt clear jwt');
      }
      done()
    });
  });

  describe('Session', function () {
    it('should return 401 unauthorized', function (done) {
      mockRequest.get('/session').reply(401);

      api.auth.get().then((res) => {
        throw new Error('auth success without being logged in');
      }).catch((err) => {
        if (err.status == 401) {
          done();
        } else {
          done(err);
        }
      });
    });

    it('should return currentUser', function (done) {
      mockRequest.post('/auth/login', { email: mock.session.email, password: mock.session.password }).reply(200, mock.session);
      mockRequest.get('/session').reply(200, mock.session);

      api.auth.login('alex.vitiuk@pressly.com', 'betame').then((session) => {
        api.auth.get().then((res) => {
          if (res.id != session.id) {
            throw new Error('Logged in user response doesnt match session response');
          }

          done();
        }).catch((err) => {
          done(err);
        });
      }).catch((err) => {
        done(err);
      });
    });
  });
});
