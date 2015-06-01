'use strict';

import Papi from '../../src';
import * as mock from './mocks';
import nock from 'nock';
import should from 'should';
import * as models from '../../src/models';

const api = new Papi();

api.auth.set({jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo#_login_post'});

nock(api.options.host)
  .matchHeader('authorization', function() { return `Bearer ${api.auth.session.jwt}`; })

  /** Hub Resource Requests ***************************************************/

  // all
  .get('/hubs').reply(200, mock.hubs)

  // find
  .get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0])

  // $resource with prepared params then find()
  .get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0])

  // all and limit
  .get('/hubs?limit=3').reply(200, mock.hubs.slice(0, 3))

  // all with query
  .get('/hubs?summaries=true&b=2').reply(200)

  /** App Resource Requests ***************************************************/

  // all
  .get(`/hubs/${mock.hubs[0].id}/apps`).reply(200, mock.apps)

  // find
  .get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}`).reply(200, mock.apps[0])

  // $resource with prepared params then all()
  .get(`/hubs/${mock.hubs[0].id}/apps`).reply(200, mock.apps)

  // all from a result model
  .get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0])
  .get(`/hubs/${mock.hubs[0].id}/apps`).reply(200, mock.apps)

  /** Style Resource Requests *************************************************/

  // all
  .get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}/styles`).reply(200, mock.styles)

  // find
  .get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}/styles/${mock.styles[0].id}`).reply(200, mock.styles[0])

  // promises resolved in an inline fashion
  .get(`/hubs`).reply(200, mock.hubs)
  .get(`/hubs/${mock.hubs[0].id}/apps`).reply(200, mock.apps)
  .get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}/styles`).reply(200, mock.styles)

  /** Stream Assets Requests **************************************************/
  // all
  .get(`/hubs/${mock.hubs[0].id}/stream`).reply(200)

  .get(`/hubs/${mock.hubs[0].id}/stream?slug=some-slug`).reply(200, {})

;

describe('Hubs Resource', function () {
  it("all should return an array", function (done) {
    api.$resource('hubs').all().then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.Hub);
      should.exist(res.nextPage);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('find should return one item', function (done) {
    api.$resource('hubs').find(mock.hubs[0].id).then((res) => {
      res.should.instanceOf(models.Hub);
      res.id.should.equal(mock.hubs[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('$resource with prepared params then find should return one item', function (done) {
    api.$resource('hubs', { id: mock.hubs[0].id }).find().then((res) => {
      res.should.instanceOf(models.Hub);
      res.id.should.equal(mock.hubs[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('all with limit should return the correct number of results', function (done) {
    api.$resource('hubs').limit(3).all().then((res) => {
      res.length.should.equal(3);
      res[0].should.instanceOf(models.Hub);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('all with query should send query params', function (done) {
    api.$resource('hubs').query({summaries: true, b: 2}).all().then((res) => {
      done();
    }).catch((err) => {
      done(err);
    });
  });
});

describe('Apps Resource', function() {
  it('all should return an array', function(done) {
    api.$resource('hubs.apps').all({hubId: mock.hubs[0].id}).then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.App);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('find should return one item', function(done) {
    api.$resource('hubs.apps').find({hubId: mock.hubs[0].id, id: mock.apps[0].id}).then((res) => {
      res.should.instanceOf(models.App);
      res.id.should.equal(mock.apps[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('$resource with prepared params then all should return an array', function(done) {
    api.$resource('hubs.apps', { hubId: mock.hubs[0].id }).all().then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.App);
      res[0].id.should.equal(mock.apps[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('should support access from the result model', function(done) {
    api.$resource('hubs').find(mock.hubs[0].id).then(function(hub) {
      hub.$resource().key.should.equal('hubs');
      hub.$resource().route.params.id.should.equal(mock.hubs[0].id);

      hub.$resource('apps').all().then(function(apps) {
        hub.should.instanceOf(models.Hub);
        apps.should.not.be.empty;
        apps[0].should.instanceOf(models.App);

        done();
      }).catch((err) => {
        done(err);
      });
    });
  });
});

describe('Styles Resource', function() {
  it('all should return an array', function(done) {
    api.$resource('hubs.apps.styles').all({hubId: mock.hubs[0].id, appId: mock.apps[0].id}).then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.Style);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('find should return one item', function(done) {
    api.$resource('hubs.apps.styles').find({hubId: mock.hubs[0].id, appId: mock.apps[0].id, id: mock.styles[0].id}).then((res) => {
      res.should.instanceOf(models.Style);
      res.id.should.equal(mock.styles[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('should fetch styles in an inline fashion', function(done) {
    api.$resource('hubs').all().then(function(hubs) {
      api.$resource('hubs.apps').all({hubId: hubs[0].id}).then(function(apps) {
         api.$resource('hubs.apps.styles').all({hubId: hubs[0].id, appId: apps[0].id}).then((res) => {
           res.should.not.be.empty;
           res[0].should.instanceOf(models.Style);

           done();
         }).catch((err) => {
           done(err);
         });
      });
    });
  });
});

describe('Stream Assets Resource', function() {
  it('should allow assets with custom routeSegment', function(done) {
    api.$resource('hubs.assets', {hubId: mock.hubs[0].id}).all().then((res) => {
      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('should get asset by slug', function(done) {
    api.$resource('hubs.assets', {hubId: mock.hubs[0].id}).get({slug: "some-slug"}).then((res) => {
      res.should.be.instanceOf(models.Asset);

      done();
    }).catch((err) => {
      done(err);
    });
  });
});
