import mockRequest from '../../lib/mock-request';


import Papi from '../../src';
import * as mock from '../api/mocks';
import should from 'should';
import * as models from '../../src/models';
import _ from 'lodash';

const api = new Papi();

api.auth.set({jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo#_login_post'});


mockRequest.config({host: api.options.host});

describe('Resources', function() {
  it('should throw if resource key is undefined', function(done) {
    should.throws(function() {
      var resource = api.$resource(undefined);
    });

    done();
  });

  it('should throw if resource key does not exist', function(done) {
    should.throws(function() {
      var resource = api.$resource('hubs.undefined');
    });

    done();
  });

  it('should throw if resource key is not found in parent resource', function(done) {
    var parentResource = api.$resource('hubs');

    should.throws(function() {
      var childResource = api.$resource('undefined', parentResource);
    });

    done();
  });

  it('should return a resource if key exists', function(done) {
    var resource = api.$resource('hubs');
    resource.name.should.equal('hubs');
    resource.constructor.modelClass.should.equal(models.Hub);

    done();
  });

  it('should return a child resource if key exists', function(done) {
    var resource = api.$resource('hubs.assets');
    resource.name.should.equal('assets');
    resource.constructor.modelClass.should.equal(models.Asset);

    done();
  });

  it('should create a new model', function(done) {
    var model = api.$resource('hubs').$create({ name: 'New Hub' });
    model.should.be.instanceOf(models.Hub);
    model.name.should.equal('New Hub');
    should(model.$newRecord).equal(true);

    done();
  });

  it('should throw error if required route params do not validate before request', function(done) {
    var model = api.$resource('hubs.assets').$create({title: 'New Article'});
    model.should.be.instanceOf(models.Asset);
    model.title.should.equal('New Article');
    should(model.$newRecord).equal(true);

    should.throws(function() {
      model.$save();
    });

    done();
  });
});
