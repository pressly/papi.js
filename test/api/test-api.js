'use strict';

import Papi from '../../src';
import * as mock from './mocks';
import nock from 'nock';
import should from 'should';
import * as models from '../../src/models';

const api = new Papi('http://beta.pressly.com');

// Interceptors
nock(api.session.domain)
  .post('/login', {
    email: 'alex.vitiuk@pressly.com',
    password: 'betame',
  }).times(1).reply(200, {
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo#_login_post'
  });

nock(api.session.domain, { reqheaders: { 'Authorization': `Bearer ${api.session.jwt}` } })
  /** Hub Resource Requests ***************************************************/

  // $all
  .get('/hubs').reply(200, mock.hubs)

  // $find
  .get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0])

  // $resource with prepared params then $find()
  .get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0])


  /** App Resource Requests ***************************************************/

  // $all
  .get(`/hubs/${mock.hubs[0].id}/apps`).reply(200, mock.apps)

  // $find
  .get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}`).reply(200, mock.apps[0])

  // $resource with prepared params then $all()
  .get(`/hubs/${mock.hubs[0].id}/apps`).reply(200, mock.apps)

  // $all from a result model
  .get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0])
  .get(`/hubs/${mock.hubs[0].id}/apps`).reply(200, mock.apps)

  // chainable $find and $all
  .get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0])
  .get(`/hubs/${mock.hubs[0].id}/apps`).reply(200, mock.apps)

  // chainable $find and $find
  .get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0])
  .get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}`).reply(200, mock.apps[0])


  /** Style Resource Requests *************************************************/

  // $all
  .get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}/styles`).reply(200, mock.styles)

  // $find
  .get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}/styles/${mock.styles[0].id}`).reply(200, mock.styles[0])

  // promises resolved in an inline fashion
  .get(`/hubs`).reply(200, mock.hubs)
  .get(`/hubs/${mock.hubs[0].id}/apps`).reply(200, mock.apps)
  .get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}/styles`).reply(200, mock.styles)

  // chainable query on find
  .get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0])
  .get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}`).reply(200, mock.apps[0])
  .get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}/styles`).reply(200, mock.styles)
;

describe('Hubs Resource', function () {
  it("$all should return an array", function (done) {
    api.$resource('hubs').$all().then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.Hub);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('$find should return one item', function (done) {
    api.$resource('hubs').$find(mock.hubs[0].id).then((res) => {
      res.should.instanceOf(models.Hub);
      res.id.should.equal(mock.hubs[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('$resource with prepared params then $find should return one item', function (done) {
    api.$resource('hubs', { id: mock.hubs[0].id }).$find().then((res) => {
      res.should.instanceOf(models.Hub);
      res.id.should.equal(mock.hubs[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });
});

describe('Apps Resource', function() {
  it('$all should return an array', function(done) {
    api.$resource('hubs.apps').$all({hubId: mock.hubs[0].id}).then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.App);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('$find should return one item', function(done) {
    api.$resource('hubs.apps').$find({hubId: mock.hubs[0].id, id: mock.apps[0].id}).then((res) => {
      res.should.instanceOf(models.App);
      res.id.should.equal(mock.apps[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('$resource with prepared params then $all should return an array', function(done) {
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
    api.$resource('hubs').$find(mock.hubs[0].id).then(function(hub) {
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

  it('should support chainable queries $find and then $all', function(done) {
    api.$resource('hubs').$find(mock.hubs[0].id).$resource('apps').$all().then(function(res) {
      var hub = res[0];
      var apps = res[1];

      hub.should.instanceOf(models.Hub);
      apps.should.not.be.empty;
      apps[0].should.instanceOf(models.App);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('should support chainable queries on $find and then $find', function(done) {
    api.$resource('hubs').$find(mock.hubs[0].id).$resource('apps').$find(mock.apps[0].id).then(function(res) {
      var hub = res[0];
      var app = res[1];

      hub.should.be.instanceOf(models.Hub);
      app.should.be.instanceOf(models.App);

      done();
    }).catch((err) => {
      done(err);
    });
  });
});

describe('Styles Resource', function() {
  it('$all should return an array', function(done) {
    api.$resource('hubs.apps.styles').$all({hubId: mock.hubs[0].id, appId: mock.apps[0].id}).then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.Style);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('$find should return one item', function(done) {
    api.$resource('hubs.apps.styles').$find({hubId: mock.hubs[0].id, appId: mock.apps[0].id, id: mock.styles[0].id}).then((res) => {
      res.should.instanceOf(models.Style);
      res.id.should.equal(mock.styles[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('should fetch styles in an inline fashion', function(done) {
    api.$resource('hubs').$all().then(function(hubs) {
      api.$resource('hubs.apps').$all({hubId: hubs[0].id}).then(function(apps) {
         api.$resource('hubs.apps.styles').$all({hubId: hubs[0].id, appId: apps[0].id}).then((res) => {
           res.should.not.be.empty;
           res[0].should.instanceOf(models.Style);

           done();
         }).catch((err) => {
           done(err);
         });
      });
    });
  });

  it('should support chainable queries on $find', function(done) {
    var a = api.$resource('hubs');
    var b = a.$find(mock.hubs[0].id);
    var c = b.$resource('apps');
    var d = c.$find(mock.apps[0].id);
    var e = d.$resource('styles');
    var f = e.$all();

    f.then(function(res) {
      var hub = res[0];
      var app = res[1];
      var styles = res[2];
      var style = styles[0];

      res.should.not.be.empty;
      res.length.should.equal(3); // 3 promises resolved
      hub.should.instanceOf(models.Hub);
      app.should.instanceOf(models.App);
      styles.should.not.be.empty;
      style.should.instanceOf(models.Style);

      done();
    }).catch((err) => {
      done(err);
    });
  })
});
