'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _slicedToArray = require('babel-runtime/helpers/sliced-to-array')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _interopRequireWildcard = require('babel-runtime/helpers/interop-require-wildcard')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

exports.applyResourcing = applyResourcing;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _models = require('./models');

var models = _interopRequireWildcard(_models);

/** Utility tools *************************************************************/

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function singularize(string) {
  return string.replace(/s$/, '');
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function decapitalize(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

function pluralize(string) {
  return string + 's';
}

function classify(string) {
  return singularize(_lodash2['default'].map(string.split('_'), function (s) {
    return capitalize(s);
  }).join(''));
}

/** Api Helpers ***************************************************************/

var buildRoute = function buildRoute(resource) {
  var current = resource;
  var segments = [];

  var path;

  if (current.options.route) {
    path = current.options.route;
  } else {

    while (current) {
      var paramName = current.options.routeSegment ? parseRouteParams(current.options.routeSegment)[0] : current.options.paramName || 'id';

      if (current !== resource) {
        paramName = singularize(current.name) + capitalize(paramName);
      }

      var routeSegment = current.options.routeSegment ? current.options.routeSegment.replace(/\/:[^\/]+$/, '/:' + paramName) : '/' + current.name + '/:' + paramName;

      segments.unshift(routeSegment);

      current = current.parent;
    }

    path = segments.join('');
  }

  var params = {};
  _lodash2['default'].each(parseRouteParams(path), function (paramName) {
    params[paramName] = null;
  });

  return { path: path, segments: segments, mySegment: segments[segments.length - 1], params: params };
};

var reRouteParams = /:[^\/]+/gi;
var parseRouteParams = function parseRouteParams(route) {
  return _lodash2['default'].map(route.match(reRouteParams), function (param) {
    return param.slice(1);
  });
};

var buildKey = function buildKey(resource, name) {
  var current = resource;
  var segments = [];

  while (current) {
    segments.unshift(current.name);
    current = current.parent;
  }

  return segments.join('.');
};

function applyResourcing(klass) {
  klass.resourceDefinitions = {};

  var pointer = function pointer(bucket, parentPointer) {
    return {
      current: null,

      resource: function resource(name, options) {
        options = options || {};
        var parent = parentPointer ? parentPointer.current : null;
        var resource = { name: name, parent: parent, children: {}, options: options };

        resource.key = buildKey(resource);
        resource.route = buildRoute(resource);
        resource.model = options.model || models[classify(name)] || models.Base;

        this.current = bucket[name] = klass.resourceDefinitions[resource.key] = resource;

        return this;
      },

      // XXX Needs impl
      action: function action(name, options) {
        return this;
      },

      open: function open() {
        return pointer(this.current.children, this);
      },

      close: function close() {
        return parentPointer;
      },

      get: function get() {
        return this.action.apply(this, arguments);
      },

      post: function post() {
        return this.action.apply(this, arguments);
      },

      put: function put() {
        return this.action.apply(this, arguments);
      },

      patch: function patch() {
        return this.action.apply(this, arguments);
      },

      'delete': function _delete() {
        return this.action.apply(this, arguments);
      }
    };
  };

  _lodash2['default'].extend(klass, pointer({}));
}

;

/** Resource class ************************************************************/

var extendPromise = function extendPromise(parentPromise, parentResource, promises) {
  promises = promises || [parentPromise];

  return _lodash2['default'].extend(parentPromise, {
    $resource: function $resource(name) {
      var key = parentResource.key + '.' + name;

      var childResource = parentResource.api.$resource(key, parentResource);

      childResource._all = childResource.all;
      childResource._find = childResource.find;

      var result = _lodash2['default'].extend(childResource, {
        all: function all() {
          var promise = childResource._all();
          return _Promise.all(promises.concat(promise));
        },

        find: function find(id) {
          childResource.includeParams({ id: id });
          var promise = childResource._find(id);
          var finalPromiseChain = _Promise.all(promises.concat(promise));

          promises.push(promise);

          return extendPromise(finalPromiseChain, childResource, promises);
        }
      });

      return result;
    }
  });
};

var parseHTTPLinks = function parseHTTPLinks(linksString) {
  var links = {};

  if (linksString && !_lodash2['default'].isEmpty(linksString)) {
    _lodash2['default'].each(linksString.split(','), function (link) {
      var _link$split = link.split(';');

      var _link$split2 = _slicedToArray(_link$split, 2);

      var href = _link$split2[0];
      var rel = _link$split2[1];

      href = href.replace(/<(.*)>/, '$1').trim();
      rel = rel.replace(/rel="(.*)"/, '$1').trim();
      links[rel] = href;
    });
  }

  return links;
};

var Resource = (function () {
  function Resource(api, key, parentResource) {
    var _this = this;

    _classCallCheck(this, Resource);

    var def = api.constructor.resourceDefinitions[key];

    if (typeof def == 'undefined') {
      throw new Error('Resource: Must supply a proper definition');
    }

    this.api = api;

    this.options = {};

    this.name = def.name;
    this.key = def.key;
    this.model = def.model;

    this.children = _lodash2['default'].map(def.children, function (child, name) {
      return name;
    }) || [];

    this.depth = parentResource ? parentResource.depth + 1 : 1;

    this.route = deepClone(def.route);
    this.route.queryParams = {};

    // Prepare route params, extends the route params from the parentResource
    if (parentResource) {
      var parentParams = {};

      _lodash2['default'].each(parentResource.route.params, function (value, paramName) {
        if (parentResource.key != _this.key && paramName == 'id') {
          paramName = singularize(parentResource.name) + 'Id';
        }

        parentParams[paramName] = value;
      });

      _lodash2['default'].extend(this.route.params, parentParams);
    }

    this.parent = function () {
      return parentResource || def.parent && this.api.$resource(def.parent.key) || null;
    };
  }

  _createClass(Resource, [{
    key: 'request',
    value: function request(method, path, options) {
      return this.api.request(method, path, _lodash2['default'].extend({}, this.options, options));
    }
  }, {
    key: 'buildRoute',
    value: function buildRoute(applyParams) {
      var path = this.route.segments.join('');

      applyParams = applyParams || false;

      if (applyParams == true) {
        _lodash2['default'].each(this.route.params, function (value, paramName) {
          path = path.replace('/:' + paramName, value ? '/' + value : '');
        });
      }

      return path;
    }
  }, {
    key: 'includeParams',
    value: function includeParams(params) {
      var _this2 = this;

      _lodash2['default'].each(params, function (value, paramName) {
        if (_this2.route.params.hasOwnProperty(paramName)) {
          _this2.route.params[paramName] = value;
        }
      });

      return this;
    }
  }, {
    key: 'query',
    value: function query(params) {
      _lodash2['default'].extend(this.route.queryParams, params);

      return this;
    }
  }, {
    key: 'limit',
    value: function limit(rpp) {
      this.query({ limit: rpp });

      return this;
    }
  }, {
    key: 'timeout',
    value: function timeout(ms) {
      this.options.timeout = ms;

      return this;
    }
  }, {
    key: 'get',
    value: function get(params) {
      var resource = new Resource(this.api, this.key, this).query(params);
      var path = resource.buildRoute(true);

      return resource.request('get', path).then(function (res) {
        var model = resource.hydrateModel(res.body);

        return model;
      });
    }
  }, {
    key: 'find',
    value: function find(params) {
      if (params && !_lodash2['default'].isObject(params)) {
        params = { id: params };
      }

      // Create a new resource for this step of the chain with included parameters
      var resource = new Resource(this.api, this.key, this).includeParams(params);
      var path = resource.buildRoute(true);

      var promise = this.api.request('get', path).then(function (res) {
        var model = resource.hydrateModel(res.body);

        return model;
      });

      return extendPromise(promise, resource);
    }
  }, {
    key: 'all',
    value: function all(params) {
      // Create a new resource for this step of the chain with included parameters
      var resource = new Resource(this.api, this.key, this).includeParams(params);
      var path = resource.buildRoute(true);

      return this.api.request('get', path, { query: this.route.queryParams }).then(function (res) {
        resource.setResponse(res);

        var collection = resource.hydrateCollection(res.body);

        return collection;
      });
    }
  }, {
    key: 'setResponse',
    value: function setResponse(res) {
      this.status = res.status;
      this.headers = res.headers;
      this.links = parseHTTPLinks(res.headers.link);
    }
  }, {
    key: 'hydrateModel',
    value: function hydrateModel(data) {
      // Create a new resource for the model based on the current resource and maintain the parent relationship
      var resource = new Resource(this.api, this.key, this);
      var model = new resource.model(data);

      _lodash2['default'].each(resource.route.params, function (value, paramName) {
        if (data[paramName]) {
          resource.route.params[paramName] = data[paramName];
        }
      });

      // Set a reference to the resource on the model
      model.$resource = function (name) {
        if (_lodash2['default'].isEmpty(name)) {
          return resource;
        } else {
          return resource.api.$resource(name, resource);
        }
      };

      return model;
    }
  }, {
    key: 'hydrateCollection',
    value: function hydrateCollection(data) {
      var _this3 = this;

      var collection = _lodash2['default'].map(data, function (item) {
        return _this3.hydrateModel(item);
      });

      _lodash2['default'].extend(collection, {
        $resource: function $resource() {
          return _this3;
        },

        nextPage: function nextPage() {
          var options = arguments[0] === undefined ? {} : arguments[0];

          if (_this3.links.next) {
            return _this3.api.request('get', _this3.links.next).then(function (res) {
              if (options.append || options.prepend) {
                _this3.setResponse(res);

                var method = options.append ? 'push' : 'unshift';

                _lodash2['default'].each(res.body, function (item) {
                  collection[method](_this3.hydrateModel(item));
                });

                return collection;
              } else {
                // XXX Not implemented yet.
                // Should create a new resource and hydrate
                return [];
              }
            });
          }
        },

        hasPage: function hasPage(name) {
          return !!_this3.links[name];
        }
      });

      return collection;
    }
  }]);

  return Resource;
})();

exports['default'] = Resource;