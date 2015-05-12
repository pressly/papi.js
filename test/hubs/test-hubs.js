'use strict';

import papi from '../../src';

const api = papi('https://beta-api.pressly.com');

describe('Testing Hubs API - $all', function () {
  it('should return all hubs', function (done) {
    api.auth.login({
      email: 'alex.vitiuk@pressly.com', password: 'betame'
    }).then(() => {
      api.hubs.setJwt(api.auth.jwt);

      api.hubs.$all().then((res) => {
        if (res.status != 200) {
          throw new Error('Something went wrong');
        }

        done();
      });
    }).catch((err) => {
      done(err);
    });
  });
});
