'use strict';

import nock from 'nock';
import Papi from '../../src';

const api = new Papi('https://beta-api.pressly.com');

// mock requests
nock(api.session.domain)
  .post('/login', {
    email: 'alex.vitiuk@pressly.com',
    password: 'betame',
  }).times(1).reply(200, {
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo#_login_post'
  });

// mock authorization requests
nock(api.session.domain, { reqheaders: { 'Authorization': `Bearer ${api.session.jwt}` } })
  .get('/hubs').reply(200, {
    status: 200,
    body: { }
  });

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
