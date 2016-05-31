import mockRequest from '../../lib/mock-request';


import Papi from '../../src';
import * as mock from './mocks';
import should from 'should';
import * as models from '../../src/models';
import _ from 'lodash';

const api = new Papi();

api.auth.set({jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo#_login_post'});


mockRequest.config({host: api.options.host});

describe('Styles Resource', function() {
  it('all should return an array', function(done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}/styles`).reply(200, mock.styles);

    api.$resource('hubs.apps.styles').$all({hubId: mock.hubs[0].id, appId: mock.apps[0].id}).then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.Style);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('find should return one item', function(done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}/styles/${mock.styles[0].id}`).reply(200, mock.styles[0]);

    api.$resource('hubs.apps.styles').$find({hubId: mock.hubs[0].id, appId: mock.apps[0].id, id: mock.styles[0].id}).then((res) => {
      res.should.instanceOf(models.Style);
      res.id.should.equal(mock.styles[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('should fetch styles in an inline fashion', function(done) {
    mockRequest.get(`/hubs`).reply(200, mock.hubs);
    mockRequest.get(`/hubs/${mock.hubs[0].id}/apps`).reply(200, mock.apps);
    mockRequest.get(`/hubs/${mock.hubs[0].id}/apps/${mock.apps[0].id}/styles`).reply(200, mock.styles);

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
});
