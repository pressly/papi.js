'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _slicedToArray = require('babel-runtime/helpers/sliced-to-array')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function singularize(string) {
  return string.replace(/s$/, '');
}

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
  function Resource(api, parentResource) {
    var _this = this;

    var inherit = arguments[2] === undefined ? false : arguments[2];

    _classCallCheck(this, Resource);

    var def = this.constructor.definition;
    if (typeof def == 'undefined') {
      throw new Error('Resource: Must supply a proper definition');
    }

    this.api = api;

    this.options = {};

    this.name = def.name;
    this.key = def.key;

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

      if (inherit) {
        this.route.queryParams = _lodash2['default'].clone(parentResource.route.queryParams);
      }
    }

    this.parent = function () {
      return parentResource || def.parent && this.api.$resource(def.parent.key) || null;
    };
  }

  _createClass(Resource, [{
    key: 'createResource',
    value: function createResource() {
      var inherit = arguments[0] === undefined ? false : arguments[0];

      return new this.constructor(this.api, this, inherit);
    }
  }, {
    key: 'request',
    value: function request() {
      var _this2 = this;

      var options = arguments[0] === undefined ? {} : arguments[0];

      return this.api.request(options.method || 'get', this.buildRoute(options.path), _lodash2['default'].extend({}, this.options, { query: _lodash2['default'].extend({}, this.route.queryParams, options.query), data: options.data })).then(function (res) {
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
          // Break out query params from route params
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
    key: '$get',
    value: function $get(params) {
      var resource = this.createResource(true).includeParams(params);

      return resource.request().then(function (res) {
        return resource.hydrateModel(res);
      });
    }
  }, {
    key: '$find',
    value: function $find(params) {
      if (params && !_lodash2['default'].isObject(params)) {
        params = { id: params };
      }

      var resource = this.createResource(true).includeParams(params);

      return resource.request().then(function (res) {
        return resource.hydrateModel(res);
      });
    }
  }, {
    key: '$all',
    value: function $all(params) {
      var resource = this.createResource(true).includeParams(params);

      return resource.request().then(function (res) {
        return resource.hydrateCollection(res);
      });
    }
  }, {
    key: '$create',
    value: function $create() {
      var data = arguments[0] === undefined ? {} : arguments[0];

      var resource = this.createResource();
      return resource.hydrateModel(data, { newRecord: true });
    }
  }, {
    key: 'setResponse',
    value: function setResponse(res) {
      this.status = res.status;
      this.headers = res.headers;
      this.links = parseHTTPLinks(res.headers.link);
    }
  }, {
    key: 'sync',
    value: function sync(data) {
      // Set route params based on data from the model
      // This is important step to take if the model queried from an all, queryParams, or action
      if (data[this.route.paramName]) {
        this.route.params[this.route.paramName] = data[this.route.paramName];
      }
    }
  }, {
    key: 'hydrateModel',
    value: function hydrateModel(data) {
      var _this4 = this;

      var options = arguments[1] === undefined ? {} : arguments[1];

      var model = new this.constructor.modelClass(data);

      if (!options.newRecord) {
        model.$newRecord = false;
      }

      this.sync(data);

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
        var resource = _this5.createResource();

        var model = resource.hydrateModel(item);

        return model;
      });

      var getPage = function getPage(page) {
        var options = arguments[1] === undefined ? {} : arguments[1];

        if (_this5.links.hasOwnProperty(page)) {
          return _this5.api.request('get', _this5.links[page]).then(function (res) {
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
      };

      var methods = {
        $resource: function $resource() {
          return _this5;
        },

        $nextPage: function $nextPage() {
          var options = arguments[0] === undefined ? {} : arguments[0];

          return getPage('next', options);
        },

        $prevPage: function $prevPage() {
          var options = arguments[0] === undefined ? {} : arguments[0];

          return getPage('prev', options);
        },

        $hasPage: function $hasPage(name) {
          return _this5.links.hasOwnProperty(name);
        },

        $find: function $find(id) {
          return _lodash2['default'].detect(collection, function (item) {
            return item.id == id;
          });
        },

        $findWhere: function $findWhere(params) {
          return _lodash2['default'].findWhere(collection, params);
        },

        $where: function $where(params) {
          return _lodash2['default'].where(collection, params);
        },

        $create: function $create() {
          var data = arguments[0] === undefined ? {} : arguments[0];

          var resource = _this5.createResource();
          return resource.hydrateModel(data, { newRecord: true });
        },

        $add: function $add(_x10, idx) {
          var model = arguments[0] === undefined ? {} : arguments[0];
          var applySorting = arguments[2] === undefined ? false : arguments[2];

          if (typeof model == 'object' && !(model instanceof _this5.constructor.modelClass)) {
            model = collection.$create(model);
          }

          if (_lodash2['default'].isNumber(idx)) {
            collection.splice(idx, 0, model);
          } else {
            collection.push(model);
          }

          if (applySorting) {
            collection.$sort();
          }

          return model;
        },

        $remove: function $remove(arg) {
          // Remove multiples
          if (_lodash2['default'].isArray(arg)) {
            var models = arg;
            _lodash2['default'].each(models, function (model) {
              collection.$remove(model);
            });

            return models;
          }

          var idx;
          if (_lodash2['default'].isNumber(arg)) {
            idx = arg;
          } else if (arg instanceof _this5.constructor.modelClass) {
            idx = collection.indexOf(arg);
          }

          if (idx >= 0 && idx < collection.length) {
            return collection.splice(idx, 1)[0];
          }
        },

        $reposition: function $reposition(fromIdx, toIdx) {
          if (fromIdx != toIdx && (fromIdx >= 0 && fromIdx < collection.length) && (toIdx >= 0 && toIdx < collection.length)) {
            var model = collection.$remove(fromIdx);

            if (model) {
              return collection.$add(model, toIdx, false);
            }
          }
        },

        $sort: function $sort() {},

        $delete: function $delete(model) {
          var params = arguments[1] === undefined ? {} : arguments[1];

          if (model instanceof _this5.constructor.modelClass) {
            return model.$delete(params).then(function () {
              return collection.$remove(model);
            });
          }
        }
      };

      _lodash2['default'].extend(collection, methods);

      return collection;
    }
  }]);

  return Resource;
})();

exports['default'] = Resource;
module.exports = exports['default'];