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


describe('Hubs Resource', function () {
  it("all should return an array", function (done) {
    mockRequest.get('/hubs').reply(200, mock.hubs);

    api.$resource('hubs').$all().then((res) => {
      res.should.not.be.empty;
      should(res.length).equal(6);
      res[0].should.instanceOf(models.Hub);
      should(res[0].$newRecord).not.equal(true);

      should.exist(res.$nextPage);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('find should return one item', function (done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0]);

    api.$resource('hubs').$find(mock.hubs[0].id).then((res) => {
      res.should.instanceOf(models.Hub);
      res.id.should.equal(mock.hubs[0].id);
      should(res.$newRecord).not.equal(true);

      // Ensure it is a model and has $attributes and $data
      res.$data().uid.should.equal('my-first-hub')

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('$resource with prepared params then find should return one item', function (done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0]);

    api.$resource('hubs', { id: mock.hubs[0].id }).$find().then((res) => {
      res.should.instanceOf(models.Hub);
      res.id.should.equal(mock.hubs[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('all with limit should return the correct number of results', function (done) {
    mockRequest.get('/hubs?limit=3').reply(200, mock.hubs.slice(0, 3));

    api.$resource('hubs').limit(3).$all().then((res) => {
      should(res.length).equal(3);
      res[0].should.instanceOf(models.Hub);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('all with query should send query params', function (done) {
    mockRequest.get('/hubs?summaries=true&b=2').reply(200);

    api.$resource('hubs').query({summaries: true, b: 2}).$all().then((res) => {
      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('can update', function (done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0]);
    mockRequest.put(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0]);

    api.$resource('hubs').$find(mock.hubs[0].id).then((res) => {
      should(res.$newRecord).equal(false);

      res.$save().then(() => {
        done();
      }).catch((err) => {
        done(err);
      });
    }).catch((err) => {
      done(err);
    });
  });

  it('should create a new model', function(done) {
    mockRequest.post(`/hubs`).reply(200, mock.hubs[0]);

    var model = api.$resource('hubs').$create({ name: 'Hello' });
    model.should.be.instanceOf(models.Hub);
    model.name.should.equal('Hello');
    should(model.$newRecord).equal(true);

    model.$save().then(function(res) {
      should(model.$newRecord).equal(false);
      model.should.be.instanceOf(models.Hub);

      done();
    }).catch(function(err) {
      done(err);
    });
  });

  it('should create a new invite', function(done) {
    mockRequest.post(`/hubs/123/invites`).reply(200, { invite: true });

    var model = api.$resource('hubs.invites', { hubId: 123 }).$create({ name: 'Hello' });
    model.should.be.instanceOf(models.Invite);
    should(model.$newRecord).equal(true);

    model.$save().then(function(res) {
      should(model.$newRecord).equal(false);
      model.should.be.instanceOf(models.Invite);

      done();
    }).catch(function(err) {
      done(err);
    });
  });
});
