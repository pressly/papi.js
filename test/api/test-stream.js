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

describe('Stream Assets Resource', function() {
  it('should allow assets with custom routeSegment', function(done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}/stream`).reply(200, mock.assets);

    api.$resource('hubs.assets', {hubId: mock.hubs[0].id}).$all().then((res) => {
      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('should find asset by slug', function(done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}/stream?slug=some-slug`).reply(200, mock.assets[0]);

    api.$resource('hubs.assets', { hubId: mock.hubs[0].id }).$find({slug: "some-slug"}).then((res) => {
      res.should.be.instanceOf(models.Asset);
      res.isVisible().should.equal(true);
      res.isOriginal().should.equal(false);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('should find asset by slug with query set', function(done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}/stream?slug=some-slug`).reply(200, mock.assets[0]);

    api.$resource('hubs.assets', { hubId: mock.hubs[0].id }).query({slug: "some-slug"}).$find().then((res) => {
      res.should.be.instanceOf(models.Asset);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('should find asset by slug with query set and then find associated data with no query set', function(done) {
    mockRequest.get(`/hubs/${mock.hubs[0].id}/stream?slug=some-slug`).reply(200, mock.assets[0]);
    mockRequest.get(`/hubs/${mock.hubs[0].id}/stream/${mock.assets[0].id}/comments`).reply(200, mock.comments);

    api.$resource('hubs.assets', { hubId: mock.hubs[0].id }).query({slug: "some-slug"}).$find().then((res) => {
      res.should.be.instanceOf(models.Asset);
      res.$resource('comments').$all().then((res) => {
        res[0].should.be.instanceOf(models.Comment);

        done();
      }).catch((err) => {
        done(err);
      });
    }).catch((err) => {
      done(err);
    });
  });
});
