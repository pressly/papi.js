(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Papi = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**

  Custom memoize function that supports 2 cache expiry modes
  - global cache expiry: Entire cache expires after a set time.
  - individual cache expiry: multiple timeouts are created for each individual hash key is destroyed.

  options:
    maxAge: (in ms)
    individualExpiry: true|false

  example:
    fn = memoize(function(a, b) {...}, {maxAge: 2000, individualExpiry: true});
    fn(1, 2);
    fn(1, 2); // Cache hit!
    fn(2, 3);
    fn(2, 3); // Cache hit!

    setTimeout(function() {
      fn(1, 2); // NO cache hit!
    }, 3000);
  })

  http://jsperf.com/comparison-of-memoization-implementations/
  by @addyosmani, @philogb, @mathias
  with a few useful tweaks from @DmitryBaranovsk

  Modified by @corban: Added expiry options

**/

function memoize(fn, options) {
  options || (options = {});

  var globalExpiryTimeout = null;
  var globalExpiryFn = function() {
    fn.memoize = {};
    globalExpiryTimeout = null;
  }

  var useGlobalExpiry = typeof options.maxAge === 'number' && !options.individualExpiry;
  var useIndividualExpiry = typeof options.maxAge === 'number' && options.individualExpiry;

  return function () {
    var args = Array.prototype.slice.call(arguments);
    var hash = "$";
    var i = args.length;
    var currentArg = null;

    while (i--) {
      currentArg = args[i];
      hash += (currentArg === Object(currentArg)) ? JSON.stringify(currentArg) : currentArg;
      fn.memoize || (fn.memoize = {});
    }

    if (hash in fn.memoize) {
      return fn.memoize[hash];
    } else {
      if (useGlobalExpiry && !globalExpiryTimeout) {
        // Starts the global cache expiry timeout if there is no current timeout scheduled
        globalExpiryTimeout = setTimeout(globalExpiryFn, options.maxAge);
      } else if (useIndividualExpiry) {
        // Starts the individual cache expiry timeout if this is the first time we are running this hash
        setTimeout(function() { delete fn.memoize[hash]; }, options.maxAge);
      }

      return fn.memoize[hash] = fn.apply(this, args);
    }
  };
}

module.exports = memoize;

},{}],2:[function(require,module,exports){
(function (global){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var hasOwnProperty = Object.prototype.hasOwnProperty;


var isNumber = function isNumber(value) {
  return typeof value == 'number';
};

var isString = function isString(value) {
  return typeof value == 'string';
};

var isFunction = function isFunction(value) {
  return typeof value == 'function';
};

var isArray = Array.isArray;

var isObject = function isObject(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return value != null && (type == 'object' || type == 'function');
};

var isEmpty = function isEmpty(value) {
  if (isArray(value) || isString(value)) {
    return !value.length;
  }

  for (var key in value) {
    if (hasOwnProperty.call(value, key)) {
      return false;
    }
  }
  return true;
};

var last = function last(value) {
  return value && value.length && value[value.length - 1];
};

var each = function each(collection, iteratee) {
  if (collection == null) {
    return collection;
  }

  if (isArray(collection)) {
    var idx = -1;
    var len = collection.length;
    while (++idx < len) {
      if (iteratee(collection[idx], idx) === false) {
        break;
      }
    }
  } else if (isObject(collection)) {
    for (var key in collection) {
      if (hasOwnProperty.call(collection, key)) {
        if (iteratee(collection[key], key) === false) {
          break;
        }
      }
    }
  }

  return collection;
};

var map = function map(collection, iteratee) {
  if (collection == null) {
    return collection;
  }

  var results = [];

  if (isArray(collection)) {
    var idx = -1;
    var len = collection.length;
    while (++idx < len) {
      results.push(iteratee(collection[idx], idx));
    }
  } else if (isObject(collection)) {
    for (var key in collection) {
      if (hasOwnProperty.call(collection, key)) {
        results.push(iteratee(collection[key], key));
      }
    }
  }

  return results;
};

var filter = function filter(collection, params) {
  var results = [];

  if (isArray(collection)) {
    var idx = -1;
    var len = collection.length;
    while (++idx < len) {
      var value = collection[idx];
      var match = true;
      for (var key in params) {
        if (hasOwnProperty.call(params, key) && (!hasOwnProperty.call(value, key) || value[key] != params[key])) {
          match = false;
          break;
        }
      }

      if (match) {
        results.push(value);
      }
    }
  }

  return results;
};

var find = function find(collection, params) {
  var result = undefined;

  if (isArray(collection)) {
    var idx = -1;
    var len = collection.length;
    while (++idx < len) {
      var value = collection[idx];
      var match = void 0;
      if (isFunction(params)) {
        var iteratee = params;

        if (iteratee(value, idx)) {
          match = true;
        }
      } else if (isObject(params)) {
        for (var key in params) {
          match = true;
          if (hasOwnProperty.call(params, key) && (!hasOwnProperty.call(value, key) || value[key] != params[key])) {
            match = false;
            break;
          }
        }
      }

      if (match) {
        result = value;
        break;
      }
    }
  }

  return result;
};

var clone = function clone(obj) {
  var result = {};

  for (var key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  }

  return result;
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function singularize$1(string) {
  return string.replace(/s$/, '');
}

var parseHTTPLinks = function parseHTTPLinks(linksString) {
  var links = {};

  if (linksString && !isEmpty(linksString)) {
    each(linksString.split(','), function (link) {
      var _link$split = link.split(';'),
          href = _link$split[0],
          rel = _link$split[1];

      href = href.replace(/<(.*)>/, '$1').trim();
      rel = rel.replace(/rel="(.*)"/, '$1').trim();
      links[rel] = href;
    });
  }

  return links;
};

var toUnderscoreCase = function toUnderscoreCase(str) {
  return str.replace(/([A-Z])/g, function ($1) {
    return "_" + $1.toLowerCase();
  });
};

var Resource = function () {
  function Resource(api, parentResource) {
    var _this = this;

    var inherit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

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

    this.actions = deepClone(def.actions);

    // Prepare route params, extends the route params from the parentResource
    if (parentResource) {
      var parentParams = {};

      each(parentResource.route.paramNames, function (paramName) {
        var parentParamName = paramName;
        if (parentResource.key != _this.key && paramName == 'id') {
          parentParamName = singularize$1(parentResource.name) + 'Id';
        }

        parentParams[parentParamName] = parentResource.route.params[paramName];
      });

      _extends(this.route.params, parentParams);

      if (inherit) {
        this.route.queryParams = clone(parentResource.route.queryParams);
      }
    }

    this.parent = function () {
      return parentResource || def.parent && this.api.$resource(def.parent.key) || null;
    };
  }

  Resource.prototype.createResource = function createResource() {
    var inherit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    return new this.constructor(this.api, this, inherit);
  };

  Resource.prototype.request = function request() {
    var _this2 = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var path = options.action ? this.buildActionPath(options.action) : this.buildPath();

    return this.api.request(options.method || 'get', path, _extends({}, this.options, { query: _extends({}, this.route.queryParams, options.query), data: options.data })).then(function (res) {
      _this2.setResponse(res);
      return res.data;
    });
  };

  Resource.prototype.buildPath = function buildPath() {
    var _this3 = this;

    var route = this.route.segments.join('');

    each(this.route.paramNames, function (paramName) {
      var value = _this3.route.params[paramName];
      if (!value && _this3.route.segments.length > 1 && paramName !== _this3.route.paramName) {
        throw new Error('$resource: Can\'t make request because route was missing \'' + paramName + '\' param.');
      }

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

    each(this.route.params, function (value, paramName) {
      route = route.replace('/:' + paramName, value ? '/' + value : '');
    });

    route += action.options.path ? action.options.path : '/' + action.name;

    return route;
  };

  Resource.prototype.includeParams = function includeParams(params) {
    var _this4 = this;

    each(params, function (value, paramName) {
      if (_this4.route.params.hasOwnProperty(paramName)) {
        _this4.route.params[paramName] = value;
      } else {
        // Break out query params from route params
        _this4.route.queryParams[paramName] = value;
      }
    });

    return this;
  };

  Resource.prototype.query = function query(params) {
    _extends(this.route.queryParams, params);

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

  Resource.prototype.$build = function $build() {
    var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var resource = this.createResource();
    return resource.hydrateModel(data, { newRecord: !data[this.route.paramName] });
  };

  Resource.prototype.$create = function $create() {
    var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this.$build(data).$save();
  };

  Resource.prototype.setResponse = function setResponse(res) {
    this.status = res.status;
    this.headers = res.headers;
    this.links = {};

    if (res.headers && res.headers.has('Link')) {
      this.links = parseHTTPLinks(res.headers.get('Link'));
    }
  };

  Resource.prototype.sync = function sync(data) {
    var _this5 = this;

    // Set route params based on data from the model
    // This is important step to take if the model queried from an all, queryParams, or action
    // Route param params are generally populated by the parent resources but sometimes
    // when hydrating a nested resourcewe will need to populate these properties from the raw data of the model
    each(Object.keys(this.route.params), function (paramName) {
      if (!_this5.route.params[paramName]) {
        // Data from the backend is in underscore case
        var param_name = toUnderscoreCase(paramName);
        _this5.route.params[paramName] = data[param_name];
      }
    });

    // XXX This will potentially cause conflict errors in the future
    // Update actions route params
    each(this.actions, function (action) {
      if (action.options.paramName) {
        _this5.route.params[action.options.paramName] = data[action.options.paramName];
      }
    });
  };

  Resource.prototype.hydrateModel = function hydrateModel(data) {
    var _this6 = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var model = new this.constructor.modelClass(data);

    this.sync(data);

    // By default the model $newRecord will be true
    if (!options.newRecord) {
      model.$newRecord = false;
    }

    // Set a reference to the resource on the model
    Object.defineProperty(model, '$resource', {
      enumerable: false,
      value: function value(name) {
        if (isEmpty(name)) {
          return _this6;
        } else {
          return _this6.api.$resource(name, _this6);
        }
      }
    });

    return model;
  };

  Resource.prototype.hydrateCollection = function hydrateCollection(data) {
    var _this7 = this;

    var collection = map(data, function (item) {
      // Models in a collection need a new resource created
      var resource = _this7.createResource();

      var model = resource.hydrateModel(item);

      return model;
    });

    var getPage = function getPage(page) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (_this7.links && _this7.links.hasOwnProperty(page)) {
        return _this7.api.request('get', _this7.links[page]).then(function (res) {
          if (options.append || options.prepend) {
            _this7.setResponse(res);

            var method = options.append ? 'push' : 'unshift';

            each(res.data, function (item) {
              collection[method](_this7.hydrateModel(item));
            });

            return collection;
          } else {
            _this7.setResponse(res);

            // Should create a new resource and hydrate
            return _this7.hydrateCollection(res.data);
          }
        });
      }
    };

    var methods = {
      $resource: function $resource() {
        return _this7;
      },

      $nextPage: function $nextPage() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        return getPage('next', options);
      },

      $prevPage: function $prevPage() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        return getPage('prev', options);
      },

      $hasPage: function $hasPage(name) {
        return _this7.links && _this7.links.hasOwnProperty(name);
      },

      $find: function $find(id) {
        return find(collection, function (item) {
          return item.id == id;
        });
      },

      $findWhere: function $findWhere(params) {
        return find(collection, params);
      },

      $where: function $where(params) {
        return filter(collection, params);
      },

      $build: function $build() {
        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var resource = _this7.createResource();
        return resource.hydrateModel(data, { newRecord: !data[_this7.route.paramName] });
      },

      $create: function $create() {
        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        return collection.$build(data).$save();
      },

      $add: function $add() {
        var model = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var idx = arguments[1];
        var applySorting = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        if ((typeof model === 'undefined' ? 'undefined' : _typeof(model)) == 'object' && !(model instanceof _this7.constructor.modelClass)) {
          model = collection.$build(model);
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
        } else if (arg instanceof _this7.constructor.modelClass) {
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
        var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (model instanceof _this7.constructor.modelClass) {
          return model.$delete(params).then(function () {
            return collection.$remove(model);
          });
        }
      },

      $data: function $data() {
        return map(collection, function (model) {
          return model.$data();
        });
      }
    };

    _extends(collection, methods);

    return collection;
  };

  return Resource;
}();

var Model = function () {
  function Model(data) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Model);

    _extends(this, data);

    Object.defineProperty(this, '$newRecord', {
      enumerable: false,
      writable: true,
      value: true
    });
  }

  Model.prototype.$delete = function $delete(params) {
    return this.$resource().request({ method: 'delete', query: params });
  };

  Model.prototype.$save = function $save(params) {
    var _this8 = this;

    var method = this.$newRecord ? 'post' : 'put';

    return this.$resource().request({ method: method, data: this, query: params }).then(function (res) {
      _this8.$newRecord = false;
      _this8.$resource().sync(res);

      return _extends(_this8, res);
    });
  };

  Model.prototype.$attributes = function $attributes() {
    return Object.keys(this);
  };

  Model.prototype.$data = function $data() {
    var _this9 = this;

    return this.$attributes().reduce(function (result, key) {
      result[key] = _this9[key];return result;
    }, {});
  };

  return Model;
}();

var Account = function (_Model) {
  _inherits(Account, _Model);

  function Account() {
    _classCallCheck(this, Account);

    return _possibleConstructorReturn(this, _Model.apply(this, arguments));
  }

  return Account;
}(Model);

var Organization = function (_Model2) {
  _inherits(Organization, _Model2);

  function Organization() {
    _classCallCheck(this, Organization);

    return _possibleConstructorReturn(this, _Model2.apply(this, arguments));
  }

  return Organization;
}(Model);

var App = function (_Model3) {
  _inherits(App, _Model3);

  function App() {
    _classCallCheck(this, App);

    return _possibleConstructorReturn(this, _Model3.apply(this, arguments));
  }

  return App;
}(Model);

var Asset = function (_Model4) {
  _inherits(Asset, _Model4);

  function Asset() {
    _classCallCheck(this, Asset);

    return _possibleConstructorReturn(this, _Model4.apply(this, arguments));
  }

  return Asset;
}(Model);

var CodeRevision = function (_Model5) {
  _inherits(CodeRevision, _Model5);

  function CodeRevision() {
    _classCallCheck(this, CodeRevision);

    return _possibleConstructorReturn(this, _Model5.apply(this, arguments));
  }

  return CodeRevision;
}(Model);

var Collection = function (_Model6) {
  _inherits(Collection, _Model6);

  function Collection() {
    _classCallCheck(this, Collection);

    return _possibleConstructorReturn(this, _Model6.apply(this, arguments));
  }

  return Collection;
}(Model);

var Comment = function (_Model7) {
  _inherits(Comment, _Model7);

  function Comment() {
    _classCallCheck(this, Comment);

    return _possibleConstructorReturn(this, _Model7.apply(this, arguments));
  }

  return Comment;
}(Model);

var Draft = function (_Model8) {
  _inherits(Draft, _Model8);

  function Draft() {
    _classCallCheck(this, Draft);

    return _possibleConstructorReturn(this, _Model8.apply(this, arguments));
  }

  return Draft;
}(Model);

var Feed = function (_Model9) {
  _inherits(Feed, _Model9);

  function Feed() {
    _classCallCheck(this, Feed);

    return _possibleConstructorReturn(this, _Model9.apply(this, arguments));
  }

  return Feed;
}(Model);

var FeedAsset = function (_Model10) {
  _inherits(FeedAsset, _Model10);

  function FeedAsset() {
    _classCallCheck(this, FeedAsset);

    return _possibleConstructorReturn(this, _Model10.apply(this, arguments));
  }

  return FeedAsset;
}(Model);

var Hub = function (_Model11) {
  _inherits(Hub, _Model11);

  function Hub() {
    _classCallCheck(this, Hub);

    return _possibleConstructorReturn(this, _Model11.apply(this, arguments));
  }

  return Hub;
}(Model);

var Invite = function (_Model12) {
  _inherits(Invite, _Model12);

  function Invite() {
    _classCallCheck(this, Invite);

    return _possibleConstructorReturn(this, _Model12.apply(this, arguments));
  }

  return Invite;
}(Model);

var Like = function (_Model13) {
  _inherits(Like, _Model13);

  function Like() {
    _classCallCheck(this, Like);

    return _possibleConstructorReturn(this, _Model13.apply(this, arguments));
  }

  return Like;
}(Model);

var Newsletter = function (_Model14) {
  _inherits(Newsletter, _Model14);

  function Newsletter() {
    _classCallCheck(this, Newsletter);

    return _possibleConstructorReturn(this, _Model14.apply(this, arguments));
  }

  return Newsletter;
}(Model);

var MailingList = function (_Model15) {
  _inherits(MailingList, _Model15);

  function MailingList() {
    _classCallCheck(this, MailingList);

    return _possibleConstructorReturn(this, _Model15.apply(this, arguments));
  }

  return MailingList;
}(Model);

var Post = function (_Model16) {
  _inherits(Post, _Model16);

  function Post() {
    _classCallCheck(this, Post);

    return _possibleConstructorReturn(this, _Model16.apply(this, arguments));
  }

  return Post;
}(Model);

var Recommendation = function (_Model17) {
  _inherits(Recommendation, _Model17);

  function Recommendation() {
    _classCallCheck(this, Recommendation);

    return _possibleConstructorReturn(this, _Model17.apply(this, arguments));
  }

  return Recommendation;
}(Model);

var Style = function (_Model18) {
  _inherits(Style, _Model18);

  function Style() {
    _classCallCheck(this, Style);

    return _possibleConstructorReturn(this, _Model18.apply(this, arguments));
  }

  return Style;
}(Model);

var Tag = function (_Model19) {
  _inherits(Tag, _Model19);

  function Tag() {
    _classCallCheck(this, Tag);

    return _possibleConstructorReturn(this, _Model19.apply(this, arguments));
  }

  return Tag;
}(Model);

var User = function (_Model20) {
  _inherits(User, _Model20);

  function User() {
    _classCallCheck(this, User);

    return _possibleConstructorReturn(this, _Model20.apply(this, arguments));
  }

  return User;
}(Model);

var Widget = function (_Model21) {
  _inherits(Widget, _Model21);

  function Widget() {
    _classCallCheck(this, Widget);

    return _possibleConstructorReturn(this, _Model21.apply(this, arguments));
  }

  return Widget;
}(Model);

var models = Object.freeze({
  Base: Model,
  Account: Account,
  Organization: Organization,
  App: App,
  Asset: Asset,
  CodeRevision: CodeRevision,
  Collection: Collection,
  Comment: Comment,
  Draft: Draft,
  Feed: Feed,
  FeedAsset: FeedAsset,
  Hub: Hub,
  Invite: Invite,
  Like: Like,
  Newsletter: Newsletter,
  MailingList: MailingList,
  Post: Post,
  Recommendation: Recommendation,
  Style: Style,
  Tag: Tag,
  User: User,
  Widget: Widget
});

function singularize(string) {
  return string.replace(/s$/, '');
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function classify(string) {
  return singularize(map(string.split("_"), function (s) {
    return capitalize(s);
  }).join(''));
}

// Builds a route object based on the resource chain
// ie: hubs > apps > styles =>
//   {
//     path: '/hubs/:hubId/apps/:appId/styles/:id',
//     segments: [ '/hubs/:hubId', '/apps/:appId', '/styles/:id' ],
//     segment: '/styles/:id',
//     params: { hubId: null, appId: null, id: null },
//     paramName: 'id'
//   }
var buildRoute = function buildRoute(resource) {
  var current = resource;
  var segments = [];

  var path;

  if (current.options.route) {
    path = current.options.route;
  } else {
    // Build full path
    while (current) {
      // Get param for this segment - default to 'id'
      var paramName = current.options.routeSegment ? parseRouteParams(current.options.routeSegment)[0] : current.options.paramName || 'id';

      // If this segment is a parent segment prepend the param name with the segment name ie. 'id' -> 'hubId'
      if (current !== resource) {
        paramName = singularize(current.name) + capitalize(paramName);
      }

      // Create route segment from custom routeSegment property or default to name/param
      var routeSegment = current.options.routeSegment ? current.options.routeSegment.replace(/\/:[^\/]+$/, '/:' + paramName) : '/' + current.name + '/:' + paramName;

      segments.unshift(routeSegment);

      current = current.parent;
    }

    path = segments.join('');
  }

  var paramNames = parseRouteParams(path);
  var params = {};
  each(paramNames, function (paramName) {
    params[paramName] = null;
  });

  return {
    path: path,
    segments: segments,
    segment: segments[segments.length - 1],
    params: params,
    paramNames: paramNames,
    paramName: paramNames[paramNames.length - 1]
  };
};

// Parses params out of a route ie. /hubs/:hubId/apps/:appId/styles/:id => ['hubId', 'appId', 'id']
var reRouteParams = /:[^\/]+/gi;
var parseRouteParams = function parseRouteParams(route) {
  return map(route.match(reRouteParams), function (param) {
    return param.slice(1);
  });
};

// Builds a key based on resource names ie. hubs.apps for the hubs > apps resource
var buildKey = function buildKey(resource, name) {
  var current = resource;
  var segments = [];

  while (current) {
    segments.unshift(current.name);
    current = current.parent;
  }

  return segments.join('.');
};

var ResourceSchema = function () {
  function ResourceSchema() {
    _classCallCheck(this, ResourceSchema);
  }

  /*
    Resource selector
     $resource();
    $resource(key);
    $resource(key, params);
    $resource(name, parentResource);
    $resource(name, params, parentResource);
  */


  ResourceSchema.prototype.$resource = function $resource() {
    var key = arguments[0];

    if (typeof key == 'undefined') {
      throw new Error("$resource: key is undefined");
    }

    var name = last(key.split('.'));
    var params = isObject(arguments[1]) && !(arguments[1] instanceof Resource) ? arguments[1] : undefined;
    var parentResource = arguments[2] || !params && arguments[1] || undefined;

    if (parentResource) {
      if (parentResource.children.indexOf(name) == -1) {
        throw new Error("$resource: key not found in parent resource.");
      }

      key = parentResource.key + '.' + name;
    }

    var resourceClass = this.constructor.resourceClasses[key];

    if (typeof resourceClass == 'undefined') {
      throw new Error('$resource: key \'' + key + '\' does not exist in schema.');
    }

    return new resourceClass(this, parentResource).includeParams(params);
  };

  ResourceSchema.prototype.$ = function $() {
    return this.$resource.apply(this, arguments);
  };

  return ResourceSchema;
}();

;

ResourceSchema.defineSchema = function () {
  var API = this;

  API.models = models;
  API.resourceClasses = {};

  var pointer = function pointer(bucket, parentPointer) {
    return {
      current: null,

      resource: function resource(name, options) {
        options = options || {};
        var parent = parentPointer ? parentPointer.current : null;

        var def = { name: name, parent: parent, children: {}, options: options };

        if (options.link) {
          def.link = options.link;
        }

        def.key = buildKey(def);
        def.route = buildRoute(def);
        def.actions = [];
        def.modelName = options.modelName || classify(name);

        this.current = bucket[name] = def;

        // create a class for this specific resource and assign the definition
        var resourceClass = function (_Resource) {
          _inherits(resourceClass, _Resource);

          function resourceClass() {
            _classCallCheck(this, resourceClass);

            return _possibleConstructorReturn(this, _Resource.apply(this, arguments));
          }

          return resourceClass;
        }(Resource);

        resourceClass.definition = def;
        resourceClass.modelClass = models[def.modelName] || Model;

        API.resourceClasses[def.key] = resourceClass;

        return this;
      },

      open: function open() {
        return pointer(this.current.children, this);
      },

      close: function close() {
        return parentPointer;
      },

      action: function action(method, name, options) {
        var action = { method: method, name: name, options: options };

        if (action.options.routeSegment) {
          action.options.paramName = parseRouteParams(action.options.routeSegment)[0];
        }

        if (parentPointer && parentPointer.current) {
          parentPointer.current.actions.push(action);
        }

        var resourceClass = API.resourceClasses[parentPointer.current.key];

        if (options.on == 'resource') {
          if (!resourceClass.prototype.hasOwnProperty('$' + name)) {
            //console.log(`- adding collection action to ${parentPointer.current.key}:`, method, name, options);

            resourceClass.prototype['$' + name] = function () {
              var _this32 = this;

              var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

              return this.request(_extends({ method: method, action: action }, { data: data })).then(function (res) {
                if (isArray(res)) {
                  return _this32.hydrateCollection(res);
                } else {
                  return _this32.hydrateModel(res);
                }
              });
            };
          } else {
            throw 'Attempted to create an action \'' + name + '\' that already exists.';
          }
        } else if (options.on == 'member') {
          if (!resourceClass.prototype.hasOwnProperty('$' + name)) {
            //console.log(`- adding member action to ${parentPointer.current.key}:`, method, name, options);

            resourceClass.prototype['$' + name] = function () {
              var _this33 = this;

              var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

              return this.request(_extends({ method: method, action: action }, { data: data })).then(function (res) {
                return _this33.hydrateModel(res);
              });
            };

            resourceClass.modelClass.prototype['$' + name] = function () {
              var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

              return this.$resource()['$' + name](data);
            };
          } else {
            throw 'Attempted to create an action \'' + name + '\' that already exists.';
          }
        }

        return this;
      },

      get: function get() {
        return this.action.apply(this, ['get'].concat(Array.prototype.slice.call(arguments)));
      },

      post: function post() {
        return this.action.apply(this, ['post'].concat(Array.prototype.slice.call(arguments)));
      },

      put: function put() {
        return this.action.apply(this, ['put'].concat(Array.prototype.slice.call(arguments)));
      },

      patch: function patch() {
        return this.action.apply(this, ['patch'].concat(Array.prototype.slice.call(arguments)));
      },

      delete: function _delete() {
        return this.action.apply(this, ['delete'].concat(Array.prototype.slice.call(arguments)));
      }
    };
  };

  return _extends({}, pointer({}));
};

// ResourceSchema.generateMarkdown = function() {
//   var API = this;
//   let markdown = "";
//
//   each(API.resourceClasses, (resourceClass) => {
//     var def = resourceClass.definition;
//
//     markdown += `###${def.modelName}\n\n`;
//     markdown += `**\`${def.key}\`**\n\n`;
//
//     if (def.parent) {
//       markdown += '#####Parent\n\n';
//       markdown += `- [${def.parent.modelName}](#${def.parent.modelName.toLowerCase()}) \`${def.parent.key}\`\n\n`;
//     }
//
//     if (!isEmpty(def.children)) {
//       markdown += '#####Children\n\n';
//       each(def.children, (child) => {
//         markdown += `- [${child.modelName}](#${child.modelName.toLowerCase()}) \`${child.key}\`\n`;
//       });
//     }
//
//     markdown += '\n\n';
//
//     if (def.link) {
//       let link = API.resourceClasses[def.link].definition;
//       markdown += `See [${link.modelName}](#${link.modelName.toLowerCase()}) \`${link.key}\`\n\n`;
//     }
//
//     let pathRoot = def.route.path.replace(/\/:.+$/, '');
//
//     markdown += '#####REST Endpoints\n\n';
//
//     markdown += `- \`GET\` ${pathRoot}\n`;
//     markdown += `- \`POST\` ${pathRoot}\n`;
//     markdown += `- \`GET\` ${def.route.path}\n`;
//     markdown += `- \`PUT\` ${def.route.path}\n`;
//     markdown += `- \`DELETE\` ${def.route.path}\n\n`;
//
//     if (!isEmpty(def.actions)) {
//       let memberActions = filter(def.actions, (action) => {
//         return action.options.on == 'member';
//       });
//
//       let collectionActions = filter(def.actions, (action) => {
//         return action.options.on == 'collection';
//       });
//
//
//       if (!isEmpty(collectionActions)) {
//         markdown += "*Collection Actions*\n\n";
//
//         each(collectionActions, (action) => {
//           markdown += `- \`${action.method.toUpperCase()}\` ${pathRoot}/${action.name}\n`
//         });
//       }
//
//       markdown += "\n\n";
//
//       if (!isEmpty(memberActions)) {
//         markdown += "*Member Actions*\n\n";
//
//         each(memberActions, (action) => {
//           markdown += `- \`${action.method.toUpperCase()}\` ${def.route.path}/${action.name}\n`
//         });
//       }
//     }
//
//     markdown += "\n\n";
//   });
//
//   console.log(markdown);
// };

if (!global.Promise) {
  global.Promise = require('promiz');
}

var AbortablePromise = require('dodgy');

if (!global.fetch) {
  global.fetch = require('isomorphic-fetch');
}

var memoize = require('../lib/memoize');

var Papi = function (_ResourceSchema) {
  _inherits(Papi, _ResourceSchema);

  function Papi() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Papi);

    var _this34 = _possibleConstructorReturn(this, _ResourceSchema.apply(this, arguments));

    _this34.options = options;
    _this34.options.host = options.host || 'https://api.pressly.com';

    _this34.requestMiddlewares = [];
    _this34.responseMiddlewares = [];

    _this34.metrics = {
      sendEvent: function sendEvent(type, message) {
        _this34.request('post', '/metrix/events/' + type, message);
      }
    };

    _this34.auth = {
      session: null,

      get: function get() {
        return _this34.request('get', '/session').then(function (res) {
          return _this34.auth.set(res.data);
        });
      },

      set: function set(session) {
        _this34.auth.session = session;

        return _this34.auth.session;
      },

      isLoggedIn: function isLoggedIn() {
        return !!_this34.auth.session && !_this34.auth.isExpired();
      },

      isExpired: function isExpired() {
        // XXX this should be using a jwt lib to figure out if the token has expired
        // XXX We do not currently include an expiry param in our tokens so just return false.
        return false;
      },

      login: function login(email, password) {
        return _this34.request('post', '/auth', { data: { email: email, password: password } }).then(function (res) {
          return _this34.auth.set(res.data);
        });
      },

      requestPasswordReset: function requestPasswordReset(email) {
        return _this34.request('post', '/auth/password_reset', { data: { email: email } });
      },

      requestNetworkCreds: function requestNetworkCreds(network) {
        return new Promise(function (resolve, reject) {
          var url = _this34.options.host + ('/auth/' + network + '?close=true');

          window.open(url);

          var handleResponse = function handleResponse(ev) {
            if (/localhost|api\.pressly\.com/.test(ev.origin)) {
              resolve(ev.data);
            } else {
              reject();
            }

            window.removeEventListener('message', handleResponse);
          };

          window.addEventListener('message', handleResponse);
        });
      },

      logout: function logout() {
        // Clear session immediately even if server fails to respond
        _this34.auth.session = null;

        return _this34.request('delete', '/session').then(function (res) {
          return res;
        });
      }
    };

    if (_this34.options.memoize == true) {
      _this34.request = memoize(_this34.request, { maxAge: 1000, individualExpiry: true });
    }
    return _this34;
  }

  Papi.prototype.request = function request(method, path) {
    var _this35 = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    return new AbortablePromise(function (resolve, reject, onAbort) {
      var url = /^(https?:)?\/\//.test(path) ? path : _this35.options.host + path;

      var req = {
        url: url,
        method: method,
        headers: {},
        query: {},
        credentials: 'include'

        // if (options.timeout || this.options.timeout) {
        //   req.timeout(options.timeout || this.options.timeout);
        // }

        // Send Authorization header when we have a JSON Web Token set in the session
      };if (_this35.auth.session && _this35.auth.session.jwt) {
        req.headers['Authorization'] = 'Bearer ' + _this35.auth.session.jwt;
      }

      req.headers['Accept'] = 'application/vnd.pressly.v2.0+json';

      // Query params to be added to the url
      if (options.query) {
        _extends(req.query, options.query);
      }

      // Data to send (with get requests these are converted into query params)
      if (options.data) {
        if (method == 'get') {
          _extends(req.query, options.data);
        } else {
          if (options.data.toString() === "[object FormData]") {
            req.body = options.data;
          } else {
            req.body = JSON.stringify(options.data);
          }
        }
      }

      if (req.body && req.body.toString() !== "[object FormData]") {
        // Default content type
        req.headers['Content-Type'] = 'application/json';
      }

      if (!isEmpty(req.query)) {
        req.url += '?' + _querystring2.default.stringify(req.query);
      }

      var res = {};

      var beginRequest = function beginRequest() {
        if (_this35.requestMiddlewares.length) {
          var offset = 0;
          var next = function next() {
            var layer = _this35.requestMiddlewares[++offset] || endRequest;
            return layer(req, res, next, resolve, reject);
          };

          _this35.requestMiddlewares[0](req, res, next, resolve, reject);
        } else {
          endRequest();
        }
      };

      var endRequest = function endRequest() {
        // XXX this is where the request will be made
        fetch(req.url, req).then(function (response) {
          if (response.status >= 200 && response.status < 300) {
            res = response;

            response.json().then(function (data) {
              res.data = data || {};
            }).catch(function (err) {
              res.data = {};
            }).then(function () {
              beginResponse();
            });
          } else {
            return reject(response);
          }
        }).catch(function (err) {
          return reject(err);
        });
      };

      var beginResponse = function beginResponse() {
        if (_this35.responseMiddlewares.length) {
          var offset = 0;
          var next = function next() {
            var layer = _this35.responseMiddlewares[++offset] || endResponse;
            return layer(req, res, next, resolve, reject);
          };

          _this35.responseMiddlewares[0](req, res, next, resolve, reject);
        } else {
          endResponse();
        }
      };

      var endResponse = function endResponse() {
        resolve(res);
      };

      onAbort(function (why) {});

      beginRequest();
    });
  };

  Papi.prototype.before = function before(middleware) {
    this.requestMiddlewares.push(middleware);
  };

  Papi.prototype.after = function after(middleware) {
    this.responseMiddlewares.push(middleware);
  };

  return Papi;
}(ResourceSchema);

module.exports = Papi;

// <= IE10, does not support static method inheritance
if (Papi.defineSchema == undefined) {
  Papi.defineSchema = ResourceSchema.defineSchema;
}

Papi.defineSchema().resource('accounts').open().get('available', { on: 'resource' }).post('become', { on: 'member' }).resource('users').resource('hubs', { link: 'hubs' }).close().resource('organizations').open().resource('users').resource('hubs').resource('invites').open().post('bulk_invite', { on: 'resource' }).post('resend', { on: 'member' }).put('accept', { on: 'member', routeSegment: '/invites/:hash' }).put('reject', { on: 'member', routeSegment: '/invites/:hash' }).close().close().resource('activity').resource('posts', { routeSegment: '/stream/posts/:id' }).resource('hubs').open().get('search', { on: 'resource' }).post('upgrade', { on: 'member' }).post('follow', { on: 'member' }).delete('unfollow', { on: 'member', path: '/follow' }).get('reach', { on: 'member' }).resource('newsletters').resource('mailinglists', { routeSegment: '/newsletters/mailinglists/:id', modelName: 'MailingList' }).resource('widgets').open().get('dimensions', { on: 'resource' }).close()

// Readonly styles endpoint
.get('styles', { on: 'member', path: '/apps/current/styles' }).resource('apps').open().get('current', { on: 'resource' }).get('build', { on: 'member', path: '/build_app' }).get('status', { on: 'member' }).resource('styles').close().resource('addons').open().resource('configs').close().resource('analytics').open().get('summary', { on: 'resource' }).get('visitors', { on: 'resource' }).get('pageviews', { on: 'resource' }).get('duration', { on: 'resource' }).close().resource('feeds').open().resource('assets', { modelName: 'FeedAsset' }).close().resource('invites').open().get('users', { on: 'resource' }).post('bulk_invite', { on: 'resource' }).post('resend', { on: 'member' }).put('accept', { on: 'member', routeSegment: '/invites/:hash' }).put('reject', { on: 'member', routeSegment: '/invites/:hash' }).close().resource('recommendations').resource('users').open().post('grant_access', { on: 'resource' }).delete('revoke_access', { on: 'member' }).close().resource('collaborators', { modelName: 'User' }).resource('collections').open().put('reorder', { on: 'resource' }).close().resource('tags')

// XXX the assets endpoint will be replaced with posts shortly
.resource('assets', { routeSegment: '/stream/:id' }).open().put('feature', { on: 'member' }).put('unfeature', { on: 'member' }).put('hide', { on: 'member' }).put('unhide', { on: 'member' }).put('lock', { on: 'member' }).put('unlock', { on: 'member' }).resource('likes').resource('comments').close().resource('posts', { routeSegment: '/posts/published/:id' }).open().put('hide', { on: 'member' }).put('unhide', { on: 'member' }).put('reorder', { on: 'member' }).resource('contributions').close().resource('scheduled', { routeSegment: '/posts/scheduled/:id' }).open().put('publish', { on: 'member' }).put('unpublish', { on: 'member' }).close().resource('submissions', { routeSegment: '/posts/submissions/:id' }).open().put('approve', { on: 'member' }).put('reject', { on: 'member' }).close().resource('drafts', { routeSegment: '/posts/drafts/:id' }).open().put('publish', { on: 'member' }).put('submit', { on: 'member' }).close().resource('deleted', { routeSegment: '/posts/deleted/:id' }).close().resource('invites').open().get('incoming', { on: 'resource' }).get('outgoing', { on: 'resource' }).post('bulk_invite', { on: 'resource' }).post('resend', { on: 'member' }).put('accept', { on: 'member', routeSegment: '/invites/:hash' }).put('reject', { on: 'member', routeSegment: '/invites/:hash' }).close().resource('code_revisions').open().get('fetch_repo', { on: 'member' })

// This resource links to the root hubs resource
.resource('hubs', { link: 'hubs' }).close().resource('signup').open().get('account_uid_available', { on: 'member' }).get('account_email_available', { on: 'member' }).close().resource('users').open().get('roles', { on: 'resource' }).resource('hubs').resource('organizations').close().resource('discover').open().resource('users', { link: 'users' }).resource('organizations', { link: 'organizations' }).resource('hubs', { link: 'hubs' }).open().get('popular', { on: 'resource' }).close().resource('posts').close().resource('creds').open().post('share', { on: 'member' }).close().resource('stream').open().close().resource('adminorganizations', { routeSegment: '/orgadmin/organizations/:id' }).resource('adminhubs', { routeSegment: '/orgadmin/hubs/:id' }).resource('adminusers', { routeSegment: '/orgadmin/users/:id' });
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../lib/memoize":1,"dodgy":3,"isomorphic-fetch":4,"promiz":5,"querystring":8}],3:[function(require,module,exports){
/*!
Copyright (C) 2015 by Andrea Giammarchi - @WebReflection

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
function Dodgy(callback, resolvable) {
  var
    resolve, reject, abort, done = false,
    dog = new Promise(function (res, rej) {
      callback(
        resolve = function resolve(how) { done = true; res(how); },
        reject = function reject(why) { done = true; rej(why); },
        function onAbort(callback) {
          abort = function abort(why) {
            if (!done) reject(callback((done = true) && why));
          };
        });
    });
  return abort ? dodger(dog, !!resolvable, resolve, reject, abort) : dog;
}
function dodger(dog, resolvable, resolve, reject, abort) {
  function wrap(previous) {
    return function () { return dodger(
      previous.apply(dog, arguments), resolvable, resolve, reject, abort);
    };
  }
  dog.then = wrap(dog.then);
  dog['catch'] = wrap(dog['catch']);
  dog.abort = abort;
  if (resolvable) {
    dog.resolve = resolve;
    dog.reject = reject;
  }
  return dog;
}
Dodgy.race = function (iterable) {
  var dog = Promise.race(iterable).then(abort);
  function abort(result) {
    for (var i = 0; i < iterable.length; i++) {
      if ('abort' in iterable[i]) iterable[i].abort();
    }
    return result;
  }
  dog.abort = abort;
  return dog;
};
module.exports = Dodgy;
Dodgy.Promise = Dodgy;
},{}],4:[function(require,module,exports){
// the whatwg-fetch polyfill installs the fetch() function
// on the global object (window or self)
//
// Return that as the export for use in Webpack, Browserify etc.
require('whatwg-fetch');
module.exports = self.fetch.bind(self);

},{"whatwg-fetch":9}],5:[function(require,module,exports){
(function () {
  global = this

  var queueId = 1
  var queue = {}
  var isRunningTask = false

  if (!global.setImmediate)
    global.addEventListener('message', function (e) {
      if (e.source == global){
        if (isRunningTask)
          nextTick(queue[e.data])
        else {
          isRunningTask = true
          try {
            queue[e.data]()
          } catch (e) {}

          delete queue[e.data]
          isRunningTask = false
        }
      }
    })

  function nextTick(fn) {
    if (global.setImmediate) setImmediate(fn)
    // if inside of web worker
    else if (global.importScripts) setTimeout(fn)
    else {
      queueId++
      queue[queueId] = fn
      global.postMessage(queueId, '*')
    }
  }

  Deferred.resolve = function (value) {
    if (!(this._d == 1))
      throw TypeError()

    if (value instanceof Deferred)
      return value

    return new Deferred(function (resolve) {
        resolve(value)
    })
  }

  Deferred.reject = function (value) {
    if (!(this._d == 1))
      throw TypeError()

    return new Deferred(function (resolve, reject) {
        reject(value)
    })
  }

  Deferred.all = function (arr) {
    if (!(this._d == 1))
      throw TypeError()

    if (!(arr instanceof Array))
      return Deferred.reject(TypeError())

    var d = new Deferred()

    function done(e, v) {
      if (v)
        return d.resolve(v)

      if (e)
        return d.reject(e)

      var unresolved = arr.reduce(function (cnt, v) {
        if (v && v.then)
          return cnt + 1
        return cnt
      }, 0)

      if(unresolved == 0)
        d.resolve(arr)

      arr.map(function (v, i) {
        if (v && v.then)
          v.then(function (r) {
            arr[i] = r
            done()
            return r
          }, done)
      })
    }

    done()

    return d
  }

  Deferred.race = function (arr) {
    if (!(this._d == 1))
      throw TypeError()

    if (!(arr instanceof Array))
      return Deferred.reject(TypeError())

    if (arr.length == 0)
      return new Deferred()

    var d = new Deferred()

    function done(e, v) {
      if (v)
        return d.resolve(v)

      if (e)
        return d.reject(e)

      var unresolved = arr.reduce(function (cnt, v) {
        if (v && v.then)
          return cnt + 1
        return cnt
      }, 0)

      if(unresolved == 0)
        d.resolve(arr)

      arr.map(function (v, i) {
        if (v && v.then)
          v.then(function (r) {
            done(null, r)
          }, done)
      })
    }

    done()

    return d
  }

  Deferred._d = 1


  /**
   * @constructor
   */
  function Deferred(resolver) {
    'use strict'
    if (typeof resolver != 'function' && resolver != undefined)
      throw TypeError()

    if (typeof this != 'object' || (this && this.then))
      throw TypeError()

    // states
    // 0: pending
    // 1: resolving
    // 2: rejecting
    // 3: resolved
    // 4: rejected
    var self = this,
      state = 0,
      val = 0,
      next = [],
      fn, er;

    self['promise'] = self

    self['resolve'] = function (v) {
      fn = self.fn
      er = self.er
      if (!state) {
        val = v
        state = 1

        nextTick(fire)
      }
      return self
    }

    self['reject'] = function (v) {
      fn = self.fn
      er = self.er
      if (!state) {
        val = v
        state = 2

        nextTick(fire)

      }
      return self
    }

    self['_d'] = 1

    self['then'] = function (_fn, _er) {
      if (!(this._d == 1))
        throw TypeError()

      var d = new Deferred()

      d.fn = _fn
      d.er = _er
      if (state == 3) {
        d.resolve(val)
      }
      else if (state == 4) {
        d.reject(val)
      }
      else {
        next.push(d)
      }

      return d
    }

    self['catch'] = function (_er) {
      return self['then'](null, _er)
    }

    var finish = function (type) {
      state = type || 4
      next.map(function (p) {
        state == 3 && p.resolve(val) || p.reject(val)
      })
    }

    try {
      if (typeof resolver == 'function')
        resolver(self['resolve'], self['reject'])
    } catch (e) {
      self['reject'](e)
    }

    return self

    // ref : reference to 'then' function
    // cb, ec, cn : successCallback, failureCallback, notThennableCallback
    function thennable (ref, cb, ec, cn) {
      // Promises can be rejected with other promises, which should pass through
      if (state == 2) {
        return cn()
      }
      if ((typeof val == 'object' || typeof val == 'function') && typeof ref == 'function') {
        try {

          // cnt protects against abuse calls from spec checker
          var cnt = 0
          ref.call(val, function (v) {
            if (cnt++) return
            val = v
            cb()
          }, function (v) {
            if (cnt++) return
            val = v
            ec()
          })
        } catch (e) {
          val = e
          ec()
        }
      } else {
        cn()
      }
    };

    function fire() {

      // check if it's a thenable
      var ref;
      try {
        ref = val && val.then
      } catch (e) {
        val = e
        state = 2
        return fire()
      }

      thennable(ref, function () {
        state = 1
        fire()
      }, function () {
        state = 2
        fire()
      }, function () {
        try {
          if (state == 1 && typeof fn == 'function') {
            val = fn(val)
          }

          else if (state == 2 && typeof er == 'function') {
            val = er(val)
            state = 1
          }
        } catch (e) {
          val = e
          return finish()
        }

        if (val == self) {
          val = TypeError()
          finish()
        } else thennable(ref, function () {
            finish(3)
          }, finish, function () {
            finish(state == 1 && 3)
          })

      })
    }


  }

  // Export our library object, either for node.js or as a globally scoped variable
  if (typeof module != 'undefined') {
    module['exports'] = Deferred
  } else {
    global['Promise'] = global['Promise'] || Deferred
  }
})()

},{}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],8:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":6,"./encode":7}],9:[function(require,module,exports){
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ]

    var isDataView = function(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj)
    }

    var isArrayBufferView = ArrayBuffer.isView || function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1])
      }, this)
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var oldValue = this.map[name]
    this.map[name] = oldValue ? oldValue+','+value : value
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    name = normalizeName(name)
    return this.has(name) ? this.map[name] : null
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value)
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this)
      }
    }
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsArrayBuffer(blob)
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsText(blob)
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf)
    var chars = new Array(view.length)

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i])
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength)
      view.set(new Uint8Array(buf))
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (!body) {
        this._bodyText = ''
      } else if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer)
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer])
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body)
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      }
    }

    this.text = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body && input._bodyInit != null) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = String(input)
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this, { body: this._bodyInit })
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers()
    rawHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':')
      var key = parts.shift().trim()
      if (key) {
        var value = parts.join(':').trim()
        headers.append(key, value)
      }
    })
    return headers
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = 'status' in options ? options.status : 200
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = 'statusText' in options ? options.statusText : 'OK'
    this.headers = new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init)
      var xhr = new XMLHttpRequest()

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        }
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

},{}]},{},[2])(2)
});