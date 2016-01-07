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
mockRequest.configure({host: api.options.host});

describe('Apps Resource', function() {
  it('all should return an array', function(done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}/apps`).reply(200, mock.apps);

    api.$resource('hubs.apps').$all({hubId: mock.hubs[0].id}).then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.App);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('find should return one item', function(done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}`).reply(200, mock.apps[0]);

    api.$resource('hubs.apps').$find({hubId: mock.hubs[0].id, id: mock.apps[0].id}).then((res) => {
      res.should.instanceOf(models.App);
      res.id.should.equal(mock.apps[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('$resource with prepared params then all should return an array', function(done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}/apps`).reply(200, mock.apps);

    api.$resource('hubs.apps', { hubId: mock.hubs[0].id }).$all().then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.App);
      res[0].id.should.equal(mock.apps[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('should support access from the result model', function(done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0]);
    mockRequest.get(`/hubs/${mock.hubs[0].id}/apps`).reply(200, mock.apps);

    api.$resource('hubs').$find(mock.hubs[0].id).then(function(hub) {
      hub.$resource().key.should.equal('hubs');
      hub.$resource().route.params.id.should.equal(mock.hubs[0].id);

      hub.$resource('apps').$all().then(function(apps) {
        hub.should.instanceOf(models.Hub);
        apps.should.not.be.empty;
        apps[0].should.instanceOf(models.App);

        done();
      }).catch((err) => {
        done(err);
      });
    });
  });

  it('should support multiple params for find', function(done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}`).reply(200, mock.apps[0]);

    api.$resource('hubs.apps').$find({ hubId: mock.hubs[0].id, id: mock.apps[0].id }).then(function(app) {
      app.should.be.instanceOf(models.App);
      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('should support accessing actions', function(done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}/apps/current`).reply(200, mock.apps[0]);

    api.$resource('hubs.apps', { hubId: mock.hubs[0].id }).$current().then(function(app) {
      app.should.be.instanceOf(models.App);
      done();
    }).catch((err) => {
      done(err);
    });
  });
});
