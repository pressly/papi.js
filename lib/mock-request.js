require('es6-promise').polyfill();
var _ = require('lodash');

var mockRequests = [];

global.fetch = global._fetch = function(url, options) {
  return new Promise(function(resolve, reject) {
    var mockRequest;

    // Get the first mock request that matches url, method and optionaly post data.
    // If no post data matches then find the first mock request with same url and method.
    mockRequest = _.find(mockRequests, function(mockRequest) {
      return mockRequest.url = url && _.isEqual(mockRequest.data, options.body);
    }) || _.find(mockRequests, function(mockRequest) {
      return mockRequest.url = url;
    });

    var idx = mockRequests.indexOf(mockRequest);

    if (idx >= 0) {
      mockRequests.splice(idx, 1);
    } else {
      return reject(new Error("Request blocked! Not found in mocks: " + url));
    }

    var response = {
      status: mockRequest.status,
      body: {},
      json: function() {
        return new Promise(function(resolve, reject) {
          return resolve(mockRequest.body);
        });
      }
    };

    setTimeout(function() {
      return resolve(response);
    }, 0);
  });
};

_fetch.mocked = true;


var mockRequest = {
  options: {},

  configure: function(options) {
    this.options = (options || {});
  },

  request: function(method, path, data) {
    var url = this.options.host ? this.options.host + path : path;

    return {
      reply: function(status, body) {
        mockRequests.push({url: url, method: method, status: status, data: data, body: body});
      }
    }
  },

  get: function(path, data) {
    return this.request('get', path, data);
  },

  put: function(path, data) {
    return this.request('put', path, data);
  },

  post: function(path, data) {
    return this.request('post', path, data);
  },

  delete: function(path, data) {
    return this.request('delete', path, data);
  }
};

module.exports = mockRequest;
