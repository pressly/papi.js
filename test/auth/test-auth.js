'use strict';

import papi from '../../src';

const api = papi('https://beta-api.pressly.com');

describe('Testing Auth API - Login', function () {
  it('should return 401', function (done) {
    api.auth.login({
      email: 'test',
      password: 'test'
    }).then(() => {
      throw new Error('login was successfull');
    }).catch((err) => {
      if (err.status == 401) {
        return done();
      }

      done(err);
    });
  });

  it('should return 200', function (done) {
    api.auth.login({
      email: 'alex.vitiuk@pressly.com',
      password: 'betame'
    }).then((res) => {
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
    api.auth.login({
      email: 'alex.vitiuk@pressly.com',
      password: 'betame'
    }).then((res) => {
      if (res.status != 200) {
        throw new Error('login unsuccessful');
      }

      if (!api.auth.jwt) {
        throw new Error('jwt was not set');
      } else if (api.auth.jwt != res.body.jwt) {
        throw new Error('wrong jwt set');
      }

      done()
    }).catch((err) => {
      done(err)
    });
  });

  it('should set currentUser', function (done) {
    api.auth.login({
      email: 'alex.vitiuk@pressly.com',
      password: 'betame'
    }).then((res) => {
      if (res.status != 200) {
        throw new Error('login unsuccessful');
      }

      if (!api.auth.currentUser) {
        throw new Error('currentUser was not set');
      } else if (api.auth.currentUser.id != res.body.id) {
        throw new Error('wrong jwt set');
      }

      done()
    }).catch((err) => {
      done(err);
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
    if (api.auth.jwt) {
      throw new Error('logout didnt clear jwt');
    }
    done()
  });

  it('should clear currentUser', function (done) {
    if (api.auth.currentUser) {
      throw new Error('logout didnt clear currentUser');
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
    api.auth.login({
      email: 'alex.vitiuk@pressly.com',
      password: 'betame'
    }).then((currentUser) => {
      api.auth.session().then((res) => {
        if (res.body.id != currentUser.body.id) {
          throw new Error('Logged in user response doesnt match session response');
        }

        done();
      });
    }).catch((err) => {
      done(err);
    });
  });
});
