import mockRequest from '../../lib/mock-request';
//import nock from 'nock'; // Needs to be imported first before papi because it overrides http and so does node-fetch

import Papi from '../../src';
import * as mock from './mocks';
import should from 'should';
import * as models from '../../src/models';
import _ from 'lodash';

const api = new Papi();

api.auth.set({jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo#_login_post'});

//var mockRequest = nock(api.options.host).matchHeader('authorization', function() { return `Bearer ${api.auth.session.jwt}`; });
mockRequest.config({host: api.options.host});

describe('Users Resource', function () {
  it("all should return an array", function (done) {
    mockRequest.get('/users').reply(200, mock.users);

    api.$resource('users').$all().then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.User);
      should(res[0].$newRecord).not.equal(true);

      should.exist(res.$nextPage);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('find should return one item', function (done) {
    mockRequest.get(`/users/${mock.users[0].id}`).reply(200, mock.users[0]);

    api.$resource('users').$find(mock.users[0].id).then((res) => {
      res.should.instanceOf(models.User);
      should(res.id).equal(mock.users[0].id);
      should(res.$newRecord).not.equal(true);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it("users.hubs should return an array of hubs", function (done) {
    mockRequest.get(`/users/${mock.users[0].id}/hubs`).reply(200, mock.hubs);

    api.$resource('users.hubs', { userId: mock.users[0].id }).$all().then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.Hub);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('$resource with prepared params then find should return one item', function (done) {
    mockRequest.get(`/users/${mock.users[0].id}`).reply(200, mock.users[0]);

    api.$resource('users', { id: mock.users[0].id }).$find().then((res) => {
      res.should.instanceOf(models.User);
      should(res.id).equal(mock.users[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('can update', function (done) {
    mockRequest.get(`/users/${mock.users[0].id}`).reply(200, mock.users[0]);
    mockRequest.put(`/users/${mock.users[0].id}`).reply(200, mock.users[0]);

    api.$resource('users').$find(mock.users[0].id).then((res) => {
      res.$save().then(() => {
        done();
      }).catch((err) => {
        done(err);
      });
    }).catch((err) => {
      done(err);
    });
  });

  // it('can search', function (done) {
  //   api.$resource('users').$search({q: 'a'}).then((res) => {
  //     console.log(res)
  //   }).catch((err) => {
  //     done(err);
  //   });
  // });

  // it('can search', function (done) {
  //   api.$resource('discover.users').$all({q: 'a'}).then((res) => {
  //     console.log(res)
  //   }).catch((err) => {
  //     done(err);
  //   });
  // });
});
