'use strict';

import papi from '../../src';

const api = papi('https://beta-api.pressly.com');

describe('Testing Users API - $all', function () {
  it('should return all users', function (done) {
    api.auth.login({
      email: 'alex.vitiuk@pressly.com', password: 'betame'
    }).then(() => {
      api.users.setJwt(api.auth.jwt);

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
