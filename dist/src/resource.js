'use strict';

//import {map, each, detect, where, findWhere, extend, clone, isEmpty, isArray, isObject, isNumber} from 'lodash';

exports.__esModule = true;

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var map = require('lodash/collection/map');
var each = require('lodash/collection/each');
var detect = require('lodash/collection/detect');
var where = require('lodash/collection/where');
var findWhere = require('lodash/collection/findWhere');
var extend = require('lodash/object/extend');
var clone = require('lodash/lang/clone');
var isObject = require('lodash/lang/isObject');
var isArray = require('lodash/lang/isArray');
var isEmpty = require('lodash/lang/isEmpty');
var isNumber = require('lodash/lang/isNumber');

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function singularize(string) {
  return string.replace(/s$/, '');
}

var parseHTTPLinks = function parseHTTPLinks(linksString) {
  var links = {};

  if (linksString && !isEmpty(linksString)) {
    each(linksString.split(','), function (link) {
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

var Resource = (function () {
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

    this.children = map(def.children, function (child, name) {
      return name;
    }) || [];

    this.depth = parentResource ? parentResource.depth + 1 : 1;

    this.route = deepClone(def.route);
    this.route.queryParams = {};

    // Prepare route params, extends the route params from the parentResource
    if (parentResource) {
      var parentParams = {};

      each(parentResource.route.params, function (value, paramName) {
        if (parentResource.key != _this.key && paramName == 'id') {
          paramName = singularize(parentResource.name) + 'Id';
        }

        parentParams[paramName] = value;
      });

      extend(this.route.params, parentParams);

      if (inherit) {
        this.route.queryParams = clone(parentResource.route.queryParams);
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

    return this.api.request(options.method || 'get', this.buildRoute(options.path), extend({}, this.options, { query: extend({}, this.route.queryParams, options.query), data: options.data })).then(function (res) {
      _this2.setResponse(res);
      return res.body;
    });
  };

  Resource.prototype.buildRoute = function buildRoute(appendPath) {
    var route = this.route.segments.join('');

    each(this.route.params, function (value, paramName) {
      route = route.replace('/:' + paramName, value ? '/' + value : '');
    });

    if (appendPath) {
      route += appendPath;
    }

    return route;
  };

  Resource.prototype.includeParams = function includeParams(params) {
    var _this3 = this;

    each(params, function (value, paramName) {
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
    extend(this.route.queryParams, params);

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
    if (params && !isObject(params)) {
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
    // Set route params based on data from the model
    // This is important step to take if the model queried from an all, queryParams, or action
    if (data[this.route.paramName]) {
      this.route.params[this.route.paramName] = data[this.route.paramName];
    }
  };

  Resource.prototype.hydrateModel = function hydrateModel(data) {
    var _this4 = this;

    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var model = new this.constructor.modelClass(data);

    if (!options.newRecord) {
      model.$newRecord = false;
    }

    this.sync(data);

    // Set a reference to the resource on the model
    model.$resource = function (name) {
      if (isEmpty(name)) {
        return _this4;
      } else {
        return _this4.api.$resource(name, _this4);
      }
    };

    return model;
  };

  Resource.prototype.hydrateCollection = function hydrateCollection(data) {
    var _this5 = this;

    var collection = map(data, function (item) {
      // Models in a collection need a new resource created
      var resource = _this5.createResource();

      var model = resource.hydrateModel(item);

      return model;
    });

    var getPage = function getPage(page) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (_this5.links.hasOwnProperty(page)) {
        return _this5.api.request('get', _this5.links[page]).then(function (res) {
          if (options.append || options.prepend) {
            _this5.setResponse(res);

            var method = options.append ? 'push' : 'unshift';

            each(res.body, function (item) {
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
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        return getPage('next', options);
      },

      $prevPage: function $prevPage() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        return getPage('prev', options);
      },

      $hasPage: function $hasPage(name) {
        return _this5.links.hasOwnProperty(name);
      },

      $find: function $find(id) {
        return detect(collection, function (item) {
          return item.id == id;
        });
      },

      $findWhere: function $findWhere(params) {
        return findWhere(collection, params);
      },

      $where: function $where(params) {
        return where(collection, params);
      },

      $create: function $create() {
        var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var resource = _this5.createResource();
        return resource.hydrateModel(data, { newRecord: true });
      },

      $add: function $add() {
        var model = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        var idx = arguments[1];
        var applySorting = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

        if ((typeof model === 'undefined' ? 'undefined' : _typeof(model)) == 'object' && !(model instanceof _this5.constructor.modelClass)) {
          model = collection.$create(model);
        }

        if (isNumber(idx)) {
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
        if (isArray(arg)) {
          var models = arg;
          each(models, function (model) {
            collection.$remove(model);
          });

          return models;
        }

        var idx;
        if (isNumber(arg)) {
          idx = arg;
        } else if (arg instanceof _this5.constructor.modelClass) {
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

        if (model instanceof _this5.constructor.modelClass) {
          return model.$delete(params).then(function () {
            return collection.$remove(model);
          });
        }
      }
    };

    extend(collection, methods);

    return collection;
  };

  return Resource;
})();

exports.default = Resource;