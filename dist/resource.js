'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _slicedToArray = require('babel-runtime/helpers/sliced-to-array')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

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

  return { path: path, segments: segments, segment: segments[segments.length - 1], params: params, paramName: resource.options.paramName || 'id' };
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
        resource.actions = [];

        this.current = bucket[name] = klass.resourceDefinitions[resource.key] = resource;

        return this;
      },

      open: function open() {
        return pointer(this.current.children, this);
      },

      close: function close() {
        return parentPointer;
      },

      action: function action(method, name, options) {
        if (parentPointer && parentPointer.current) {
          parentPointer.current.actions.push({ method: method, name: name, options: options });
        }

        return this;
      },

      get: function get() {
        return this.action.call(this, 'get', arguments[0], arguments[1]);
      },

      post: function post() {
        return this.action.call(this, 'post', arguments[0], arguments[1]);
      },

      put: function put() {
        return this.action.call(this, 'put', arguments[0], arguments[1]);
      },

      patch: function patch() {
        return this.action.call(this, 'patch', arguments[0], arguments[1]);
      },

      'delete': function _delete() {
        return this.action.call(this, 'delete', arguments[0], arguments[1]);
      }
    };
  };

  _lodash2['default'].extend(klass, pointer({}));
}

;

/** Resource class ************************************************************/

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

      this.route.queryParams = _lodash2['default'].clone(parentResource.route.queryParams);
    }

    this.parent = function () {
      return parentResource || def.parent && this.api.$resource(def.parent.key) || null;
    };

    _lodash2['default'].each(def.actions, function (action) {
      _this[action.name] = function () {
        var options = arguments[0] === undefined ? {} : arguments[0];

        return _this.request(_lodash2['default'].extend({ method: action.method, path: action.options.path || '/' + action.name }, options)).then(function (res) {
          return _this.hydrateModel(res);
        });
      };
    });
  }

  _createClass(Resource, [{
    key: 'request',
    value: function request() {
      var _this2 = this;

      var options = arguments[0] === undefined ? {} : arguments[0];

      return this.api.request(options.method || 'get', this.buildRoute(options.path), { query: _lodash2['default'].extend({}, this.route.queryParams, options.query), data: options.data }).then(function (res) {
        _this2.setResponse(res);
        return res.body;
      });
    }
  }, {
    key: 'buildRoute',
    value: function buildRoute(appendPath) {
      var route = this.route.segments.join('');

      _lodash2['default'].each(this.route.params, function (value, paramName) {
        route = route.replace('/:' + paramName, value ? '/' + value : '');
      });

      if (appendPath) {
        route += appendPath;
      }

      return route;
    }
  }, {
    key: 'includeParams',
    value: function includeParams(params) {
      var _this3 = this;

      _lodash2['default'].each(params, function (value, paramName) {
        if (_this3.route.params.hasOwnProperty(paramName)) {
          _this3.route.params[paramName] = value;
        } else {
          _this3.route.queryParams[paramName] = value;
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
      var path = resource.buildRoute();

      return this.api.request('get', path, { query: resource.route.queryParams }).then(function (res) {
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

      var resource = new Resource(this.api, this.key, this).includeParams(params);

      return resource.request().then(function (res) {
        return resource.hydrateModel(res);
      });
    }
  }, {
    key: 'all',
    value: function all(params) {
      var resource = new Resource(this.api, this.key, this).includeParams(params);

      return resource.request().then(function (res) {
        return resource.hydrateCollection(res);
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
      var _this4 = this;

      var model = new this.model(data, { persisted: true });

      // Set route params based on data from the model
      if (data[this.route.paramName]) {
        this.route.params[this.route.paramName] = data[this.route.paramName];
      }

      // Set a reference to the resource on the model
      model.$resource = function (name) {
        if (_lodash2['default'].isEmpty(name)) {
          return _this4;
        } else {
          return _this4.api.$resource(name, _this4);
        }
      };

      return model;
    }
  }, {
    key: 'hydrateCollection',
    value: function hydrateCollection(data) {
      var _this5 = this;

      var collection = _lodash2['default'].map(data, function (item) {
        // Models in a collection need a new resource created
        var resource = new Resource(_this5.api, _this5.key, _this5);
        var model = resource.hydrateModel(item);

        return model;
      });

      _lodash2['default'].extend(collection, {
        $resource: function $resource() {
          return _this5;
        },

        nextPage: function nextPage() {
          var options = arguments[0] === undefined ? {} : arguments[0];

          if (_this5.links.next) {
            return _this5.api.request('get', _this5.links.next).then(function (res) {
              if (options.append || options.prepend) {
                _this5.setResponse(res);

                var method = options.append ? 'push' : 'unshift';

                _lodash2['default'].each(res.body, function (item) {
                  collection[method](_this5.hydrateModel(item));
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
          return !!_this5.links[name];
        }
      });

      return collection;
    }
  }]);

  return Resource;
})();

exports['default'] = Resource;