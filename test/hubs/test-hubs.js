'use strict';

import Papi from '../../src';

const api = new Papi('https://beta-api.pressly.com');

describe('Testing Hubs API - $all', function () {
  it('should return all hubs', function (done) {
    api.auth.login('alex.vitiuk@pressly.com', 'betame').then(() => {
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
