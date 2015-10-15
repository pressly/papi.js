'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _resource = require('./resource');

var _resource2 = _interopRequireDefault(_resource);

var _models = require('./models');

var models = _interopRequireWildcard(_models);

function singularize(string) {
  return string.replace(/s$/, '');
}

function classify(string) {
  return singularize(_lodash2['default'].map(string.split("_"), function (s) {
    return _lodash2['default'].capitalize(s);
  }).join(''));
}

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
        paramName = singularize(current.name) + _lodash2['default'].capitalize(paramName);
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

var ResourceSchema = (function () {
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

    var name = _lodash2['default'].last(key.split('.'));
    var params = _lodash2['default'].isObject(arguments[1]) && !(arguments[1] instanceof _resource2['default']) ? arguments[1] : undefined;
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
})();

exports['default'] = ResourceSchema;
;

ResourceSchema.defineSchema = function () {
  var API = this;

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
        var resourceClass = (function (_Resource) {
          _inherits(resourceClass, _Resource);

          function resourceClass() {
            _classCallCheck(this, resourceClass);

            _Resource.apply(this, arguments);
          }

          return resourceClass;
        })(_resource2['default']);

        resourceClass.definition = def;
        resourceClass.modelClass = models[def.modelName] || models.Base;

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
        if (parentPointer && parentPointer.current) {
          parentPointer.current.actions.push({ method: method, name: name, options: options });
        }

        if (options.on == 'resource') {
          var resourceClass = API.resourceClasses[parentPointer.current.key];

          if (!resourceClass.prototype.hasOwnProperty('$' + name)) {
            //console.log(`- adding collection action to ${parentPointer.current.key}:`, method, name);

            resourceClass.prototype['$' + name] = function () {
              var _this = this;

              var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

              return this.request(_lodash2['default'].extend({ method: method, path: options.path || '/' + name }, { data: data })).then(function (res) {
                if (_lodash2['default'].isArray(res)) {
                  return _this.hydrateCollection(res);
                } else {
                  return _this.hydrateModel(res);
                }
              });
            };
          }
        } else if (options.on == 'member') {
          var modelClass = API.resourceClasses[parentPointer.current.key].modelClass;

          if (!modelClass.prototype.hasOwnProperty('$' + name)) {
            //console.log(`- adding member action to ${parentPointer.current.key}:`, method, name);

            modelClass.prototype['$' + name] = function () {
              var _this2 = this;

              var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

              return this.$resource().request(_lodash2['default'].extend({ method: method, path: options.path || '/' + name }, { data: data })).then(function (res) {
                return _this2.$resource().hydrateModel(res);
              });
            };
          }
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

  return _lodash2['default'].extend({}, pointer({}));
};

ResourceSchema.generateMarkdown = function () {
  var API = this;
  var markdown = "";

  _lodash2['default'].each(API.resourceClasses, function (resourceClass) {
    var def = resourceClass.definition;

    markdown += '###' + def.modelName + '\n\n';
    markdown += '**`' + def.key + '`**\n\n';

    if (def.parent) {
      markdown += '#####Parent\n\n';
      markdown += '- [' + def.parent.modelName + '](#' + def.parent.modelName.toLowerCase() + ') `' + def.parent.key + '`\n\n';
    }

    if (!_lodash2['default'].isEmpty(def.children)) {
      markdown += '#####Children\n\n';
      _lodash2['default'].each(def.children, function (child) {
        markdown += '- [' + child.modelName + '](#' + child.modelName.toLowerCase() + ') `' + child.key + '`\n';
      });
    }

    markdown += '\n\n';

    if (def.link) {
      var link = API.resourceClasses[def.linkTo].definition;
      markdown += 'See [' + link.modelName + '](#' + link.modelName.toLowerCase() + ') `' + link.key + '`\n\n';
    }

    var pathRoot = def.route.path.replace(/\/:.+$/, '');

    markdown += '#####REST Endpoints\n\n';

    markdown += '- `GET` ' + pathRoot + '\n';
    markdown += '- `POST` ' + pathRoot + '\n';
    markdown += '- `GET` ' + def.route.path + '\n';
    markdown += '- `PUT` ' + def.route.path + '\n';
    markdown += '- `DELETE` ' + def.route.path + '\n\n';

    if (!_lodash2['default'].isEmpty(def.actions)) {
      var memberActions = _lodash2['default'].select(def.actions, function (action) {
        return action.options.on == 'member';
      });

      var collectionActions = _lodash2['default'].select(def.actions, function (action) {
        return action.options.on == 'collection';
      });

      if (!_lodash2['default'].isEmpty(collectionActions)) {
        markdown += "*Collection Actions*\n\n";

        _lodash2['default'].each(collectionActions, function (action) {
          markdown += '- `' + action.method.toUpperCase() + '` ' + pathRoot + '/' + action.name + '\n';
        });
      }

      markdown += "\n\n";

      if (!_lodash2['default'].isEmpty(memberActions)) {
        markdown += "*Member Actions*\n\n";

        _lodash2['default'].each(memberActions, function (action) {
          markdown += '- `' + action.method.toUpperCase() + '` ' + def.route.path + '/' + action.name + '\n';
        });
      }
    }

    markdown += "\n\n";
  });

  console.log(markdown);
};
module.exports = exports['default'];