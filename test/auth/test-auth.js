'use strict';

import Papi from '../../src';
import nock from 'nock';
import should from 'should';

const api = new Papi();

// mocks
const mockSession = {
  id: '54f0db7308afa12b53620588',
  email: 'alex.vitiuk@pressly.com',
  username: 'alex',
  password: 'betame',
  account_id: '54f0db7308afa12b53620587',
  jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo',
  name: 'Alex',
  permissions: {
    global_permissions: [],
    hub_permissions: {
      "54f6227386f2f7000a000170":["*"],
      "54f8c8f486f2f7000a000236":["*"],
      "550358044bb240000100009c":["*"],
      "55073ed94bb24000010001d2":["*"],
      "551073f64072910001000078":["*"],
      "5540ed5d468bb00001000042":["*"]
    },
    account_permissions: {
      "54f0db7308afa12b53620587":["*"],
      "54f0db7308afa12b53620588":["*"]
    }
  },
};

nock(api.session.domain)
  .post('/login', { email: 'test', password: 'test', }).reply(401)
  .post('/login', { email: mockSession.email, password: mockSession.password }).times(3).reply(200, mockSession);

nock(api.session.domain, { reqheaders: { 'Authorization': `Bearer ${api.session.jwt}` } })
  .get('/auth/logout').reply(200)
  .get('/auth/session').times(2).reply(function() {
    if (api.session.jwt) {
      return [200, mockSession];
    }

    return [401, mockSession];
  });

// clear outstanding mocks
after(function() {
  nock.cleanAll();
});

// tests
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
      if (res.status != 200) {
        throw new Error('login unsuccessful');
      }

      res.body.id.should.be.exactly(mockSession.id);
      res.body.jwt.should.be.exactly(mockSession.jwt);
      res.body.email.should.be.exactly(mockSession.email);
      res.body.username.should.be.exactly(mockSession.username);
      res.body.account_id.should.not.be.empty;

      done();
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
