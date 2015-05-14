'use strict';

import nock from 'nock';
import Papi from '../../src';

const api = new Papi();

// mock requests
nock(api.session.domain)
  .post('/login', {
    email: 'test',
    password: 'test',
  }).reply(401)
  .post('/login', {
    email: 'alex.vitiuk@pressly.com',
    password: 'betame',
  }).times(3).reply(200, {
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo#_login_post'
  });

// mock authorization requests
nock(api.session.domain, { reqheaders: { 'Authorization': `Bearer ${api.session.jwt}` } })
  .get('/auth/logout').reply(200)
  .get('/auth/session').times(2).reply(function() {
    if (api.session.jwt) {
      return [200, { status: 200, body: { } }];
    }

    return [401, { status: 401, body: { } }];
  });

describe('Testing Auth API - Login', function () {
  it('should return 401', function (done) {
    api.auth.login('test', 'test').then(() => {
      throw new Error('login was successfull');
    }).catch((err) => {
      if (err.status == 401) {
        return done();
      }

      done(err);
    });
  });

  it('should return 200', function (done) {
    api.auth.login('alex.vitiuk@pressly.com', 'betame').then((res) => {
      if (res.status == 200) {
        done()
      } else {
        throw new Error('login unsuccessful');
      }
    }).catch((err) => {
      done(err);
    });
  });

  it('should set jwt', function (done) {
    api.auth.login('alex.vitiuk@pressly.com', 'betame').then((res) => {
      if (res.status != 200) {
        throw new Error('login unsuccessful');
      }

      if (!api.session.jwt) {
        throw new Error('jwt was not set');
      } else if (api.session.jwt != res.body.jwt) {
        throw new Error('wrong jwt set');
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

  it('should clear jwt', function (done) {
    if (api.session.jwt) {
      throw new Error('logout didnt clear jwt');
    }
    done()
  });
});

describe('Testing Auth API - Session', function () {
  it('should return 401 unauthorized', function (done) {
    api.auth.session().then((res) => {
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
    api.auth.login('alex.vitiuk@pressly.com', 'betame').then((currentUser) => {
      api.auth.session().then((res) => {
        if (res.body.id != currentUser.body.id) {
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
