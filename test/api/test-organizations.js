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


describe('Organizations Resource', function () {
  it("all should return an array", function (done) {
    mockRequest.get('/organizations').reply(200, mock.organizations);

    api.$resource('organizations').$all().then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.Organization);
      should(res[0].$newRecord).not.equal(true);
      should(res.length).equal(1);
      should.exist(res.$nextPage);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('find should return one item', function (done) {
    mockRequest.get(`/organizations/${mock.organizations[0].id}`).reply(200, mock.organizations[0]);

    api.$resource('organizations').$find(mock.organizations[0].id).then((res) => {
      res.should.instanceOf(models.Organization);
      should(res.id).equal(mock.organizations[0].id);
      should(res.$newRecord).not.equal(true);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('$resource with prepared params then find should return one item', function (done) {
    mockRequest.get(`/organizations/${mock.organizations[0].id}`).reply(200, mock.organizations[0]);

    api.$resource('organizations', { id: mock.organizations[0].id }).$find().then((res) => {
      res.should.instanceOf(models.Organization);
      should(res.id).equal(mock.organizations[0].id);

      done();
    }).catch((err) => {
      done(err);
    });
  });
});