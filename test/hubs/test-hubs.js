'use strict';

import Papi from '../../src';
import { mockHub } from '../mocks';
import nock from 'nock';
import should from 'should';

const api = new Papi('https://beta-api.pressly.com');


// interceptors
nock(api.session.domain)
  .post('/login', {
    email: 'alex.vitiuk@pressly.com',
    password: 'betame',
  }).times(1).reply(200, {
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo#_login_post'
  });

nock(api.session.domain, { reqheaders: { 'Authorization': `Bearer ${api.session.jwt}` } })
  .get('/hubs').reply(200)
  .get(`/hubs/${mockHub.id}`).reply(200, mockHub);

// tests
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

  it('should return one hub', function (done) {
    api.hubs.$find(mockHub.id).then((res) => {
      if (res.status != 200) {
        throw new Error('Something went wrong');
      }

      res.body.id.should.be.exactly(mockHub.id);
      res.body.uid.should.not.be.empty;
      res.body.name.should.not.be.empty;
      res.body.account_id.should.not.be.empty;

      done();
    }).catch((err) => {
      done(err);
    });
  });
});
