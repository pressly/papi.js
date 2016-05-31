import mockRequest from '../../lib/mock-request';



import Papi from '../../src';
import * as mock from './mocks';
import should from 'should';
import * as models from '../../src/models';
import _ from 'lodash';

const api = new Papi();

api.auth.set({jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo#_login_post'});


mockRequest.config({host: api.options.host});

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
