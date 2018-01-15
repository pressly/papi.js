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

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function singularize$1(string) {
  return string.replace(/s$/, '');
}

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
    this.links = res.links;
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

            // parse http links into a usable format
            res.links = {};
            if (res.headers && res.headers.has('Link')) {
              res.links = parseHTTPLinks(res.headers.get('Link'));
            }

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