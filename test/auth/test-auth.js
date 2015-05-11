'use strict';

import papi from '../../src';

const api = papi('https://beta-api.pressly.com');

describe('Testing Auth API - Invalid Login', function () {
  it('should return 401', function (done) {
    api.auth.login({
      email: 'test',
      password: 'test'
    }).then(() => {
      throw new Error('login was successfull');
    }).catch((err) => {
      if (err.status != 401) {
        throw new Error(`status should be 401 but got ${err.status}`);
      }
      done();
    });
  });
});

describe('Testing Auth API - Successful Login', function () {
  it('should return 200', function (done) {
    api.auth.login({
      email: 'alex.vitiuk@pressly.com',
      password: 'betame'
    }).then((res) => {
      if (res.status == 200) {
        done()
      } else {
        throw new Error('login unsuccessfull');
      }
    }).catch((err) => {
      throw new Error(err);
    });
  });
});
