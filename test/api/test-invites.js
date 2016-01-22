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

describe('Invites Resource', function() {
  it('all should return an array', function(done) {
    mockRequest.get('/invites/incoming').reply(200, mock.invites);

    api.$resource('invites').$incoming().then((res) => {
      res.should.not.be.empty;
      res[0].should.instanceOf(models.Invite);

      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('can accept an invite from resource', function(done) {
    mockRequest.get('/invites/incoming').reply(200, mock.invites);
    mockRequest.get('/invites/' + mock.invites[0].hash + '/accept').reply(200);

    api.$resource('invites').$incoming().then((invites) => {
      invites[0].$accept().then((res) => {
        done()
      }).catch((err) => {
        done(err);
      });
    }).catch((err) => {
      done(err);
    });
  });
});
