'use strict';

var _last = require('lodash/array/last');

var _last2 = _interopRequireDefault(_last);

var _all = require('lodash/collection/all');

var _all2 = _interopRequireDefault(_all);

var _pick = require('lodash/object/pick');

var _pick2 = _interopRequireDefault(_pick);

var _functions = require('lodash/object/functions');

var _functions2 = _interopRequireDefault(_functions);

var _keys = require('lodash/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _difference = require('lodash/array/difference');

var _difference2 = _interopRequireDefault(_difference);

var _filter = require('lodash/collection/filter');

var _filter2 = _interopRequireDefault(_filter);

var _isArray = require('lodash/lang/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isNumber = require('lodash/lang/isNumber');

var _isNumber2 = _interopRequireDefault(_isNumber);

var _where = require('lodash/collection/where');

var _where2 = _interopRequireDefault(_where);

var _findWhere = require('lodash/collection/findWhere');

var _findWhere2 = _interopRequireDefault(_findWhere);

var _detect = require('lodash/collection/detect');

var _detect2 = _interopRequireDefault(_detect);

var _isObject = require('lodash/lang/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _clone = require('lodash/lang/clone');

var _clone2 = _interopRequireDefault(_clone);

var _extend = require('lodash/object/extend');

var _extend2 = _interopRequireDefault(_extend);

var _map = require('lodash/collection/map');

var _map2 = _interopRequireDefault(_map);

var _each = require('lodash/collection/each');

var _each2 = _interopRequireDefault(_each);

var _isEmpty = require('lodash/lang/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _promiz = require('promiz');

var _promiz2 = _interopRequireDefault(_promiz);

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function singularize$1(string) {
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
          paramName = singularize$1(parentResource.name) + 'Id';
        }

        parentParams[paramName] = value;
      });

      (0, _extend2.default)(this.route.params, parentParams);

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

    return this.api.request(options.method || 'get', path, (0, _extend2.default)({}, this.options, { query: (0, _extend2.default)({}, this.route.queryParams, options.query), data: options.data })).then(function (res) {
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
    (0, _extend2.default)(this.route.queryParams, params);

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
    this.links = {};

    if (res.headers && res.headers.has('Link')) {
      this.links = parseHTTPLinks(res.headers.get('Link'));
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

      if (_this6.links && _this6.links.hasOwnProperty(page)) {
        return _this6.api.request('get', _this6.links[page]).then(function (res) {
          if (options.append || options.prepend) {
            _this6.setResponse(res);

            var method = options.append ? 'push' : 'unshift';

            (0, _each2.default)(res.data, function (item) {
              collection[method](_this6.hydrateModel(item));
            });

            return collection;
          } else {
            _this6.setResponse(res);

            // Should create a new resource and hydrate
            return _this6.hydrateCollection(res.data);
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
        return _this6.links && _this6.links.hasOwnProperty(name);
      },

      $find: function $find(id) {
        return (0, _detect2.default)(collection, function (item) {
          return item.id == id;
        });
      },

      $findWhere: function $findWhere(params) {
        return (0, _findWhere2.default)(collection, params);
      },

      $where: function $where(params) {
        return (0, _where2.default)(collection, params);
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

    (0, _extend2.default)(collection, methods);

    return collection;
  };

  return Resource;
}();

var Model = function () {
  function Model(data) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Model);

    (0, _extend2.default)(this, data);

    this.$newRecord = true;
  }

  Model.prototype.$delete = function $delete(params) {
    return this.$resource().request({ method: 'delete', query: params });
  };

  Model.prototype.$save = function $save(params) {
    var _this7 = this;

    var method = this.$newRecord ? 'post' : 'put';

    return this.$resource().request({ method: method, data: this, query: params }).then(function (res) {
      _this7.$newRecord = false;
      _this7.$resource().sync(res);

      return (0, _extend2.default)(_this7, res);
    });
  };

  Model.prototype.$attributes = function $attributes() {
    return (0, _filter2.default)((0, _difference2.default)((0, _keys2.default)(this), (0, _functions2.default)(this)), function (x) {
      return x[0] != '$';
    });
  };

  Model.prototype.$data = function $data() {
    return (0, _pick2.default)(this, this.$attributes());
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

var DISPLAY_STATES = {
  VISIBLE: 1,
  FEATURED: 2,
  HIGHLIGHTED: 4,
  LOCKED: 8
};

var Asset = function (_Model4) {
  _inherits(Asset, _Model4);

  function Asset() {
    _classCallCheck(this, Asset);

    return _possibleConstructorReturn(this, _Model4.apply(this, arguments));
  }

  Asset.prototype.isVisible = function isVisible() {
    return (this.display_state & DISPLAY_STATES.VISIBLE) === DISPLAY_STATES.VISIBLE;
  };

  Asset.prototype.isHidden = function isHidden() {
    return (this.display_state & DISPLAY_STATES.VISIBLE) !== DISPLAY_STATES.VISIBLE;
  };

  Asset.prototype.isFeatured = function isFeatured() {
    return (this.display_state & DISPLAY_STATES.FEATURED) === DISPLAY_STATES.FEATURED;
  };

  Asset.prototype.isHighlighted = function isHighlighted() {
    return (this.display_state & DISPLAY_STATES.HIGHLIGHTED) === DISPLAY_STATES.HIGHLIGHTED;
  };

  Asset.prototype.isLocked = function isLocked() {
    return (this.display_state & DISPLAY_STATES.LOCKED) === DISPLAY_STATES.LOCKED;
  };

  Asset.prototype.isOriginal = function isOriginal() {
    return (0, _all2.default)((0, _pick2.default)(this.source, 'network', 'uid', 'url'), _isEmpty2.default);
  };

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

var Recommendation = function (_Model14) {
  _inherits(Recommendation, _Model14);

  function Recommendation() {
    _classCallCheck(this, Recommendation);

    return _possibleConstructorReturn(this, _Model14.apply(this, arguments));
  }

  return Recommendation;
}(Model);

var Style = function (_Model15) {
  _inherits(Style, _Model15);

  function Style() {
    _classCallCheck(this, Style);

    return _possibleConstructorReturn(this, _Model15.apply(this, arguments));
  }

  return Style;
}(Model);

var Tag = function (_Model16) {
  _inherits(Tag, _Model16);

  function Tag() {
    _classCallCheck(this, Tag);

    return _possibleConstructorReturn(this, _Model16.apply(this, arguments));
  }

  return Tag;
}(Model);

var User = function (_Model17) {
  _inherits(User, _Model17);

  function User() {
    _classCallCheck(this, User);

    return _possibleConstructorReturn(this, _Model17.apply(this, arguments));
  }

  User.prototype.hasAccess = function hasAccess() {
    return this.access.status === 0;
  };

  return User;
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
  Recommendation: Recommendation,
  Style: Style,
  Tag: Tag,
  User: User
});

function singularize(string) {
  return string.replace(/s$/, '');
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function classify(string) {
  return singularize((0, _map2.default)(string.split("_"), function (s) {
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

  var params = {};
  (0, _each2.default)(parseRouteParams(path), function (paramName) {
    params[paramName] = null;
  });

  return {
    path: path,
    segments: segments,
    segment: segments[segments.length - 1],
    params: params,
    paramName: resource.options.paramName || 'id'
  };
};

// Parses params out of a route ie. /hubs/:hubId/apps/:appId/styles/:id => ['hubId', 'appId', 'id']
var reRouteParams = /:[^\/]+/gi;
var parseRouteParams = function parseRouteParams(route) {
  return (0, _map2.default)(route.match(reRouteParams), function (param) {
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

    var name = (0, _last2.default)(key.split('.'));
    var params = (0, _isObject2.default)(arguments[1]) && !(arguments[1] instanceof Resource) ? arguments[1] : undefined;
    var parentResource = arguments[2] || !params && arguments[1] || undefined;

    if (parentResource) {
      if (parentResource.children.indexOf(name) == -1) {
        throw new Error("$resource: key not found in parent resource.");
      }

      key = parentResource.key + '.' + name;
    }

    return new this.constructor.resourceClasses[key](this, parentResource).includeParams(params);
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
              var _this26 = this;

              var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

              return this.request((0, _extend2.default)({ method: method, action: action }, { data: data })).then(function (res) {
                if ((0, _isArray2.default)(res)) {
                  return _this26.hydrateCollection(res);
                } else {
                  return _this26.hydrateModel(res);
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
              var _this27 = this;

              var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

              return this.request((0, _extend2.default)({ method: method, action: action }, { data: data })).then(function (res) {
                return _this27.hydrateModel(res);
              });
            };

            resourceClass.modelClass.prototype['$' + name] = function () {
              var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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

  return (0, _extend2.default)({}, pointer({}));
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
//       let memberActions = select(def.actions, (action) => {
//         return action.options.on == 'member';
//       });
//
//       let collectionActions = select(def.actions, (action) => {
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
  global.Promise = _promiz2.default;
}

var AbortablePromise = require('dodgy');

if (!global.fetch) {
  global.fetch = _isomorphicFetch2.default;
}

function hasXDomain() {
  return typeof window !== 'undefined' && window.xdomain != null;
}

var Papi = function (_ResourceSchema) {
  _inherits(Papi, _ResourceSchema);

  function Papi() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Papi);

    var _this28 = _possibleConstructorReturn(this, _ResourceSchema.apply(this, arguments));

    _this28.options = options;
    _this28.options.host = options.host || 'https://api.pressly.com';

    if (hasXDomain()) {
      var slaves = {};
      slaves[_this28.options.host] = '/proxy.html';
      window.xdomain.slaves(slaves);
    }

    _this28.requestMiddlewares = [];
    _this28.responseMiddlewares = [];

    _this28.auth = {
      session: null,

      get: function get() {
        return _this28.request('get', '/session').then(function (res) {
          return _this28.auth.set(res.data);
        });
      },

      set: function set(session) {
        if (!session.jwt) {
          throw new Error('Papi:Auth: Invalid session response - missing jwt');
        }

        _this28.auth.session = session;

        return _this28.auth.session;
      },

      isLoggedIn: function isLoggedIn() {
        return !!_this28.auth.session && !_this28.auth.isExpired();
      },

      isExpired: function isExpired() {
        // XXX this should be using a jwt lib to figure out if the token has expired
        // XXX We do not currently include an expiry param in our tokens so just return false.
        return false;
      },

      login: function login(email, password) {
        return _this28.request('post', '/auth', { data: { email: email, password: password } }).then(function (res) {
          return _this28.auth.set(res.data);
        });
      },

      requestPasswordReset: function requestPasswordReset(email) {
        return _this28.request('post', '/auth/password_reset', { data: { email: email } });
      },

      logout: function logout() {
        // Clear session immediately even if server fails to respond
        _this28.auth.session = null;

        return _this28.request('delete', '/session').then(function (res) {
          return res;
        });
      }
    };
    return _this28;
  }

  Papi.prototype.request = function request(method, path) {
    var _this29 = this;

    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    return new AbortablePromise(function (resolve, reject, onAbort) {
      var url = /^(https?:)?\/\//.test(path) ? path : _this29.options.host + path;

      var req = {
        url: url,
        method: method,
        headers: {},
        query: {}
      };

      req.headers['Content-Type'] = 'application/json';

      // if (options.timeout || this.options.timeout) {
      //   req.timeout(options.timeout || this.options.timeout);
      // }

      // Allow sending cookies from origin
      if (typeof req.withCredentials == 'function' && !hasXDomain()) {
        req.credentials = 'include';
      }

      // Send Authorization header when we have a JSON Web Token set in the session
      if (_this29.auth.session && _this29.auth.session.jwt) {
        req.headers['Authorization'] = 'Bearer ' + _this29.auth.session.jwt;
      }

      req.headers['Accept'] = 'application/vnd.pressly.v0.12+json';

      // Query params to be added to the url
      if (options.query) {
        (0, _extend2.default)(req.query, options.query);
      }

      // Data to send (with get requests these are converted into query params)
      if (options.data) {
        if (method == 'get') {
          (0, _extend2.default)(req.query, options.data);
        } else {
          req.body = JSON.stringify(options.data);
        }
      }

      if (!(0, _isEmpty2.default)(req.query)) {
        req.url += '?' + _querystring2.default.stringify(req.query);
      }

      var res = {};

      var beginRequest = function beginRequest() {
        if (_this29.requestMiddlewares.length) {
          var offset = 0;
          var next = function next() {
            var layer = _this29.requestMiddlewares[++offset] || endRequest;
            return layer(req, res, next, resolve, reject);
          };

          _this29.requestMiddlewares[0](req, res, next, resolve, reject);
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
        if (_this29.responseMiddlewares.length) {
          var offset = 0;
          var next = function next() {
            var layer = _this29.responseMiddlewares[++offset] || endResponse;
            return layer(req, res, next, resolve, reject);
          };

          _this29.responseMiddlewares[0](req, res, next, resolve, reject);
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

Papi.defineSchema().resource('accounts').open().get('available', { on: 'resource' }).post('become', { on: 'member' }).resource('users').resource('hubs', { link: 'hubs' }).close().resource('organizations').open().resource('users').resource('hubs').resource('invites').open().post('bulk_invite', { on: 'resource' }).post('resend', { on: 'member' }).put('accept', { on: 'member', routeSegment: '/invites/:hash' }).put('reject', { on: 'member', routeSegment: '/invites/:hash' }).close().close().resource('activity').resource('posts', { routeSegment: '/stream/posts/:id' }).resource('hubs').open().get('search', { on: 'resource' }).post('upgrade', { on: 'member' }).post('follow', { on: 'member' }).delete('unfollow', { on: 'member' }).resource('apps').open().get('current', { on: 'resource' }).get('build', { on: 'member', path: '/build_app' }).get('status', { on: 'member' }).resource('styles').close().resource('addons').open().resource('configs').close().resource('analytics').open().get('summary', { on: 'resource' }).get('visitors', { on: 'resource' }).get('pageviews', { on: 'resource' }).get('duration', { on: 'resource' }).close().resource('feeds').open().resource('assets', { modelName: 'FeedAsset' }).close().resource('invites').open().post('bulk_invite', { on: 'resource' }).post('resend', { on: 'member' }).put('accept', { on: 'member', routeSegment: '/invites/:hash' }).put('reject', { on: 'member', routeSegment: '/invites/:hash' }).close().resource('recommendations').resource('users').open().post('grant_access', { on: 'resource' }).delete('revoke_access', { on: 'member' }).close().resource('collections').open().put('reorder', { on: 'resource' }).close().resource('tags').resource('assets', { routeSegment: '/stream/:id' }).open().put('feature', { on: 'member' }).put('unfeature', { on: 'member' }).put('hide', { on: 'member' }).put('unhide', { on: 'member' }).put('lock', { on: 'member' }).put('unlock', { on: 'member' }).resource('likes').resource('comments').close().resource('drafts').open().put('publish', { on: 'member' }).close().close().resource('invites').open().get('incoming', { on: 'resource' }).get('outgoing', { on: 'resource' }).post('bulk_invite', { on: 'resource' }).post('resend', { on: 'member' }).put('accept', { on: 'member', routeSegment: '/invites/:hash' }).put('reject', { on: 'member', routeSegment: '/invites/:hash' }).close().resource('code_revisions').open().get('fetch_repo', { on: 'member' })

// This resource links to the root hubs resource
.resource('hubs', { link: 'hubs' }).close().resource('signup').open().get('account_uid_available', { on: 'member' }).get('account_email_available', { on: 'member' }).close().resource('users').open().get('roles', { on: 'resource' }).resource('hubs').resource('organizations').close().resource('discover').open().resource('users', { link: 'users' }).resource('organizations', { link: 'organizations' }).resource('hubs', { link: 'hubs' }).resource('posts').close().resource('creds').open().post('share', { on: 'member' }).close().resource('stream').open().resource('following').close();