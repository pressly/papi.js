'use strict';

import Papi from '../../src';
import { mockUser } from '../mocks';
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
  .get('/users').reply(200, { status: 200, body: { } })
  .get(`/users/${mockUser.id}`).reply(200, mockUser);

// tests
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
    api.users.$find(mockUser.id).then((res) => {
      if (res.status != 200) {
        throw new Error('Something went wrong');
      }

      res.body.id.should.be.exactly(mockUser.id);
      res.body.email.should.be.exactly(mockUser.email);
      res.body.username.should.not.be.empty;
      res.body.account_id.should.not.be.empty;

      done();
    }).catch((err) => {
      done(err);
    });
  });
});
