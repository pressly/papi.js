'use strict';

exports.__esModule = true;

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isNumber = require('lodash/isNumber');

var _isNumber2 = _interopRequireDefault(_isNumber);

var _filter = require('lodash/filter');

var _filter2 = _interopRequireDefault(_filter);

var _find = require('lodash/find');

var _find2 = _interopRequireDefault(_find);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _assignIn = require('lodash/assignIn');

var _assignIn2 = _interopRequireDefault(_assignIn);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _each = require('lodash/each');

var _each2 = _interopRequireDefault(_each);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function singularize(string) {
  return string.replace(/s$/, '');
}

var parseHTTPLinks = function parseHTTPLinks(linksString) {
  var links = {};

  if (linksString && !(0, _isEmpty2.default)(linksString)) {
    (0, _each2.default)(linksString.split(','), function (link) {
      var _link$split = link.split(';');

      var href = _link$split[0];
      var rel = _link$split[1];

      href = href.replace(/<(.*)>/, '$1').trim();
      rel = rel.replace(/rel="(.*)"/, '$1').trim();
      links[rel] = href;
    });
  }

  return links;
};

var Resource = function () {
  function Resource(api, parentResource) {
    var _this = this;

    var inherit = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

    _classCallCheck(this, Resource);

    var def = this.constructor.definition;
    if (typeof def == 'undefined') {
      throw new Error("Resource: Must supply a proper definition");
    }

    this.api = api;

    this.options = {};

    this.name = def.name;
    this.key = def.key;

    this.children = (0, _map2.default)(def.children, function (child, name) {
      return name;
    }) || [];

    this.depth = parentResource ? parentResource.depth + 1 : 1;

    this.route = deepClone(def.route);
    this.route.queryParams = {};

    this.actions = deepClone(def.actions);

    // Prepare route params, extends the route params from the parentResource
    if (parentResource) {
      var parentParams = {};

      (0, _each2.default)(parentResource.route.params, function (value, paramName) {
        if (parentResource.key != _this.key && paramName == 'id') {
          paramName = singularize(parentResource.name) + 'Id';
        }

        parentParams[paramName] = value;
      });

      (0, _assignIn2.default)(this.route.params, parentParams);

      if (inherit) {
        this.route.queryParams = (0, _clone2.default)(parentResource.route.queryParams);
      }
    }

    this.parent = function () {
      return parentResource || def.parent && this.api.$resource(def.parent.key) || null;
    };
  }

  Resource.prototype.createResource = function createResource() {
    var inherit = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

    return new this.constructor(this.api, this, inherit);
  };

  Resource.prototype.request = function request() {
    var _this2 = this;

    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var path = options.action ? this.buildActionPath(options.action) : this.buildPath();

    return this.api.request(options.method || 'get', path, (0, _assignIn2.default)({}, this.options, { query: (0, _assignIn2.default)({}, this.route.queryParams, options.query), data: options.data })).then(function (res) {
      _this2.setResponse(res);
      return res.data;
    });
  };

  Resource.prototype.buildPath = function buildPath() {
    var route = this.route.segments.join('');

    (0, _each2.default)(this.route.params, function (value, paramName) {
      route = route.replace('/:' + paramName, value ? '/' + value : '');
    });

    return route;
  };

  Resource.prototype.buildActionPath = function buildActionPath(action) {
    var segments = this.route.segments;

    if (action.options.routeSegment) {
      segments.splice(segments.length - 1, 1, action.options.routeSegment);
    }

    var route = segments.join('');

    (0, _each2.default)(this.route.params, function (value, paramName) {
      route = route.replace('/:' + paramName, value ? '/' + value : '');
    });

    route += action.options.path ? action.options.path : '/' + action.name;

    return route;
  };

  Resource.prototype.includeParams = function includeParams(params) {
    var _this3 = this;

    (0, _each2.default)(params, function (value, paramName) {
      if (_this3.route.params.hasOwnProperty(paramName)) {
        _this3.route.params[paramName] = value;
      } else {
        // Break out query params from route params
        _this3.route.queryParams[paramName] = value;
      }
    });

    return this;
  };

  Resource.prototype.query = function query(params) {
    (0, _assignIn2.default)(this.route.queryParams, params);

    return this;
  };

  Resource.prototype.limit = function limit(rpp) {
    this.query({ limit: rpp });

    return this;
  };

  Resource.prototype.timeout = function timeout(ms) {
    this.options.timeout = ms;

    return this;
  };

  Resource.prototype.$get = function $get(params) {
    var resource = this.createResource(true).includeParams(params);

    return resource.request().then(function (res) {
      return resource.hydrateModel(res);
    });
  };

  Resource.prototype.$find = function $find(params) {
    if (params && !(0, _isObject2.default)(params)) {
      params = { id: params };
    }

    var resource = this.createResource(true).includeParams(params);

    return resource.request().then(function (res) {
      return resource.hydrateModel(res);
    });
  };

  Resource.prototype.$all = function $all(params) {
    var resource = this.createResource(true).includeParams(params);

    return resource.request().then(function (res) {
      return resource.hydrateCollection(res);
    });
  };

  Resource.prototype.$create = function $create() {
    var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var resource = this.createResource();
    return resource.hydrateModel(data, { newRecord: true });
  };

  Resource.prototype.setResponse = function setResponse(res) {
    this.status = res.status;
    this.headers = res.headers;

    if (res.headers && res.headers.link) {
      this.links = parseHTTPLinks(res.headers.link);
    }
  };

  Resource.prototype.sync = function sync(data) {
    var _this4 = this;

    // Set route params based on data from the model
    // This is important step to take if the model queried from an all, queryParams, or action
    if (data[this.route.paramName]) {
      this.route.params[this.route.paramName] = data[this.route.paramName];
    }

    // Update actions route params
    (0, _each2.default)(this.actions, function (action) {
      _this4.route.params[action.options.paramName] = data[action.options.paramName];
    });
  };

  Resource.prototype.hydrateModel = function hydrateModel(data) {
    var _this5 = this;

    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var model = new this.constructor.modelClass(data);

    if (!options.newRecord) {
      model.$newRecord = false;
    }

    this.sync(data);

    // Set a reference to the resource on the model
    model.$resource = function (name) {
      if ((0, _isEmpty2.default)(name)) {
        return _this5;
      } else {
        return _this5.api.$resource(name, _this5);
      }
    };

    return model;
  };

  Resource.prototype.hydrateCollection = function hydrateCollection(data) {
    var _this6 = this;

    var collection = (0, _map2.default)(data, function (item) {
      // Models in a collection need a new resource created
      var resource = _this6.createResource();

      var model = resource.hydrateModel(item);

      return model;
    });

    var getPage = function getPage(page) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (_this6.links.hasOwnProperty(page)) {
        return _this6.api.request('get', _this6.links[page]).then(function (res) {
          if (options.append || options.prepend) {
            _this6.setResponse(res);

            var method = options.append ? 'push' : 'unshift';

            (0, _each2.default)(res.data, function (item) {
              collection[method](_this6.hydrateModel(item));
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
        return _this6;
      },

      $nextPage: function $nextPage() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        return getPage('next', options);
      },

      $prevPage: function $prevPage() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        return getPage('prev', options);
      },

      $hasPage: function $hasPage(name) {
        return _this6.links.hasOwnProperty(name);
      },

      $find: function $find(id) {
        return (0, _find2.default)(collection, function (item) {
          return item.id == id;
        });
      },

      $findWhere: function $findWhere(params) {
        return (0, _find2.default)(collection, params);
      },

      $where: function $where(params) {
        return (0, _filter2.default)(collection, params);
      },

      $create: function $create() {
        var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var resource = _this6.createResource();
        return resource.hydrateModel(data, { newRecord: true });
      },

      $add: function $add() {
        var model = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        var idx = arguments[1];
        var applySorting = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

        if ((typeof model === 'undefined' ? 'undefined' : _typeof(model)) == 'object' && !(model instanceof _this6.constructor.modelClass)) {
          model = collection.$create(model);
        }

        if ((0, _isNumber2.default)(idx)) {
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
        if ((0, _isArray2.default)(arg)) {
          var models = arg;
          (0, _each2.default)(models, function (model) {
            collection.$remove(model);
          });

          return models;
        }

        var idx;
        if ((0, _isNumber2.default)(arg)) {
          idx = arg;
        } else if (arg instanceof _this6.constructor.modelClass) {
          idx = collection.indexOf(arg);
        }

        if (idx >= 0 && idx < collection.length) {
          return collection.splice(idx, 1)[0];
        }
      },

      $reposition: function $reposition(fromIdx, toIdx) {
        if (fromIdx != toIdx && fromIdx >= 0 && fromIdx < collection.length && toIdx >= 0 && toIdx < collection.length) {
          var model = collection.$remove(fromIdx);

          if (model) {
            return collection.$add(model, toIdx, false);
          }
        }
      },

      $sort: function $sort() {},

      $delete: function $delete(model) {
        var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        if (model instanceof _this6.constructor.modelClass) {
          return model.$delete(params).then(function () {
            return collection.$remove(model);
          });
        }
      }
    };

    (0, _assignIn2.default)(collection, methods);

    return collection;
  };

  return Resource;
}();

exports.default = Resource;