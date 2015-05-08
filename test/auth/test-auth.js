'use strict';

import papi from '../../src';

const api = papi('https://beta-api.pressly.com');

describe('Testing Auth API', function () {
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
