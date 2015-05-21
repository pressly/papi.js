'use strict';

import Papi from '../../src';
import * as mock from '../mocks';
import nock from 'nock';
import should from 'should';

//const api = new Papi('http://beta.pressly.com', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo#_login_post');
const api = new Papi('http://beta.pressly.com');


// interceptors
nock(api.session.domain)
  .post('/login', {
    email: 'alex.vitiuk@pressly.com',
    password: 'betame',
  }).times(1).reply(200, {
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo#_login_post'
  });

nock(api.session.domain, { reqheaders: { 'Authorization': `Bearer ${api.session.jwt}` } })
  .get('/hubs').reply(200, mock.hubs)
  .get(`/hubs/${mock.hubs[0].id}`).reply(200, mock.hubs[0]);

// tests
describe('Testing !!!NEW API', function () {
  it('should return all hubs', function (done) {
    api.$query('hubs').$all().then((res) => {
      res.should.not.be.empty;
      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('should return one hub', function (done) {
    api.$query('hubs').$find(mock.hubs[0].id).then((res) => {
      res.id.should.be.exactly(mock.hubs[0].id);
      res.uid.should.not.be.empty;
      res.name.should.not.be.empty;
      res.account_id.should.not.be.empty;

      done();
    }).catch((err) => {
      done(err);
    });
  });


  // describe('hubs.$all', function(test) {
  //   api.$query('hubs').$all().then(function(res) {
  //     test(_.isArray(res) && res[0].constructor == models.Hub);
  //   }).catch(function(err) {
  //     test(false, err);
  //   });
  // });
  //
  // // Support $find on root level endpoint
  // describe('hubs.$find', function(test) {
  //   api.$query('hubs').$find('5527e3b0ec798feb57000044').then(function(res) {
  //     test(_.isObject(res) && res.constructor == models.Hub);
  //   }).catch(function(err) {
  //     test(false, err)
  //   });
  // });
  //
  // // Support $all on child level endpoint
  // describe('hubs.apps.$all', function(test) {
  //   api.$query('hubs.apps').$all({hubId: '5527e3b0ec798feb57000044'}).then(function(res) {
  //     test(_.isArray(res));
  //   }).catch(function(err) {
  //     test(false, err);
  //   });
  // });
  //
  // // Support $find on child level endpoint
  // describe('hubs.apps.$find', function(test) {
  //   api.$query('hubs.apps').$find({hubId: '5527e3b0ec798feb57000044', id: '5550ca65ec798fa92a00000c'}).then(function(res) {
  //     test(_.isObject(res));
  //   }).catch(function(err) {
  //     test(false, err);
  //   });
  // });
  //
  // // Support $find on child level endpoint
  // describe('hubs.apps.styles.$find', function(test) {
  //   api.$query('hubs.apps.styles').$all({hubId: '5527e3b0ec798feb57000044', appId: '5550ca65ec798fa92a00000c'}).then(function(res) {
  //     test(_.isArray(res) && res[0].constructor == models.Style);
  //   }).catch(function(err) {
  //     test(false, err);
  //   });
  // });
  //
  // // Supports inline fetches
  // describe('hubs.$find then hubs.apps.$all', function(test) {
  //   api.$query('hubs').$find('5527e3b0ec798feb57000044').then(function(hub) {
  //     api.$query('hubs.apps').$all({hubId: hub.id}).then(function(apps) {
  //       test(hub.constructor == models.Hub && apps[0].constructor == models.App);
  //     });
  //   }).catch(function(err) {
  //     test(false, err);
  //   });
  // });
  //
  // // Support resource access from the result model
  // describe('hubResultModel.apps.$all', function(test) {
  //   api.$query('hubs').$find('5527e3b0ec798feb57000044').then(function(hub) {
  //     hub.$query('apps').$all().then(function(apps) {
  //       test(hub.constructor == models.Hub && apps[0].constructor == models.App);
  //     }).catch(function(err) {
  //       test(false, err);
  //     });
  //   }).catch(function(err) {
  //     test(false, err);
  //   });
  // });
  //
  // // Support chainable $all on child resource association
  // describe('hubs.$find.apps.$all', function(test) {
  //   api.$query('hubs').$find('5527e3b0ec798feb57000044').$query('apps').$all().then(function(res) {
  //     var hub = res[0];
  //     var apps = res[1];
  //     //console.log(hub, apps);
  //     test(_.isObject(hub) && _.isArray(apps) && hub.constructor == models.Hub && apps[0].constructor == models.App);
  //   }).catch(function(err) {
  //     test(false, err);
  //   });
  // });
  //
  //
  // // Support $find on child level endpoint
  // describe('hubs.$find.apps.$find.styles.$all', function(test) {
  //   var a = api.$query('hubs');
  //   var b = a.$find('5527e3b0ec798feb57000044');
  //   var c = b.$query('apps');
  //   var d = c.$find('5550ca65ec798fa92a00000c');
  //   var e = d.$query('styles');
  //   var f = e.$all();
  //
  //   f.then(function(res) {
  //     var hub = res[0];
  //     var app = res[1];
  //     var styles = res[2];
  //     var style = styles[0];
  //
  //     test(_.isArray(res) && res.length == 3 && hub.constructor == models.Hub && app.constructor == models.App && style.constructor == models.Style);
  //   }).catch(function(err) {
  //     test(false, err);
  //   });
  // });

});
