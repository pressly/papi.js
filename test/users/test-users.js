'use strict';

import Papi from '../../src';

const api = new Papi('https://beta-api.pressly.com');

describe('Testing Users API - $all', function () {
  it('should return all users', function (done) {
    api.auth.login('alex.vitiuk@pressly.com', 'betame').then(() => {
      api.users.$all().then((res) => {
        if (res.status != 200) {
          throw new Error('Something went wrong');
        }

        done();
      });
    }).catch((err) => {
      done(err);
    });
  });

  it('should return one user', function (done) {
    let userId = '54f0db7308afa12b53620588';

    api.users.$find(userId).then((res) => {
      if (res.status != 200) {
        throw new Error('Something went wrong');
      }

      done();
    }).catch((err) => {
      done(err);
    });
  });
});
