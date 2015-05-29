'use strict';

import Papi from '../../src';
import * as mock from './mocks';
import nock from 'nock';
import should from 'should';

const api = new Papi();

// interceptors
nock(api.options.host)
.post('/login', { email: 'incorrect-email', password: 'incorrect-password', }).reply(401)
.post('/login', { email: mock.session.email, password: mock.session.password }).times(3).reply(200, mock.session);

nock(api.options.host)
.get('/auth/logout').reply(200)
.get('/auth/session').times(2).reply(function() {
  if (api.auth.session) {
    return [200, mock.session];
  }

  return [401, null];
})

// clear outstanding interceptors
after(function() {
  nock.cleanAll();
});

describe('Testing Auth API - Login', function () {
  it('should return 401 when given incorrect email or password', function (done) {
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

describe('Testing Auth API - Logout', function () {
  it('should logout user', function (done) {
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

describe('Testing Auth API - Session', function () {
  it('should return 401 unauthorized', function (done) {
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
