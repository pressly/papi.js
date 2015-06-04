'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _resource = require('./resource');

var _resource2 = _interopRequireDefault(_resource);

var Papi = (function () {
  function Papi() {
    var _this = this;

    var options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Papi);

    this.options = options;
    this.options.host = options.host || 'https://beta-api.pressly.com';

    this.callbacks = [];

    this.auth = {
      session: null,

      get: function get() {
        return _this.request('get', '/auth/session').then(function (res) {
          return _this.auth.set(res.body);
        });
      },

      set: function set(session) {
        if (!session.jwt) {
          throw new Error('Papi:Auth: Invalid session response - missing jwt');
        }

        _this.auth.session = session;

        return _this.auth.session;
      },

      isLoggedIn: function isLoggedIn() {
        return !!_this.auth.session && !_this.auth.isExpired();
      },

      isExpired: function isExpired() {
        // XXX this should be using a jwt lib to figure out if the token has expired
        // XXX We do not currently include an expiry param in our tokens so just return false.
        return false;
      },

      login: function login(email, password) {
        return _this.request('post', '/login', { data: { email: email, password: password } }).then(function (res) {
          return _this.auth.set(res.body);
        });
      },

      logout: function logout() {
        return _this.request('get', '/auth/logout').then(function (res) {
          _this.auth.session = null;

          return res;
        });
      }
    };
  }

  _createClass(Papi, [{
    key: '$resource',

    /*
       Resource selector
       $resource();
      $resource(key);
      $resource(key, params);
      $resource(name, parentResource);
      $resource(name, params, parentResource);
    */
    value: function $resource() {
      var key = arguments[0];

      if (typeof key == 'undefined') {
        throw new Error('Papi::$resource: key is undefined');
      }

      var name = _lodash2['default'].last(key.split('.'));
      var params = _lodash2['default'].isObject(arguments[1]) && !(arguments[1] instanceof _resource2['default']) ? arguments[1] : undefined;
      var parentResource = arguments[2] || !params && arguments[1] || undefined;

      if (parentResource) {
        if (parentResource.children.indexOf(name) == -1) {
          throw new Error('Papi::$resource: key not found in parent resource.');
        }

        key = parentResource.key + '.' + name;
      }

      return new _resource2['default'](this, key, parentResource).includeParams(params);
    }
  }, {
    key: 'request',
    value: function request(method, path) {
      var _this2 = this;

      var options = arguments[2] === undefined ? {} : arguments[2];

      return new _bluebird2['default'](function (resolve, reject) {
        var url = /^(https?:)?\/\//.test(path) ? path : _this2.options.host + path;
        var req = _superagent2['default'][method](url);
        req.set('Content-Type', 'application/json');

        if (options.timeout || _this2.options.timeout) {
          req.timeout(options.timeout || _this2.options.timeout);
        }

        // Allow sending cookies from origin
        if (typeof req.withCredentials == 'function') {
          req.withCredentials();
        }

        // Send Authorization header when we have a JSON Web Token set in the session
        if (_this2.auth.session && _this2.auth.session.jwt) {
          req.set('Authorization', 'Bearer ' + _this2.auth.session.jwt);
        }

        // Query params to be added to the url
        if (options.query) {
          req.query(options.query);
        }

        // Data to send (with get requests these are converted into query params)
        if (options.data) {
          req.send(options.data);
        }

        req.end(function (err, res) {
          setTimeout(function () {
            _lodash2['default'].each(_this2.callbacks, function (cb) {
              cb(res);
            });
          });

          if (err) {
            return reject(err);
          } else {
            resolve(res);
          }
        });
      });
    }
  }, {
    key: 'on',

    // Register callback to fire after each request finishes
    // returns a deregister function.
    value: function on(callback) {
      var _this3 = this;

      this.callbacks.push(callback);

      return function () {
        _this3.off(callback);
      };
    }
  }, {
    key: 'off',
    value: function off(callback) {
      var idx = this.callbacks.indexOf(callback);

      if (idx >= 0) {
        this.callbacks.splice(idx, 1);
      }
    }
  }]);

  return Papi;
})();

exports['default'] = Papi;

(0, _resource.applyResourcing)(Papi);

Papi.resource('accounts').open().resource('users').resource('hubs', { linkTo: 'hubs' }).close().resource('hubs').open().post('upgrade').get('search', { on: 'collection' }).resource('apps').open().get('current', { path: '/current' }).resource('styles').close().resource('analytics').resource('feeds').open().resource('assets', { modelName: 'FeedAsset' }).close().resource('invites').resource('recommendations').resource('users').resource('collections').resource('tags').resource('assets', { routeSegment: '/stream/:id' }).open().put('feature').put('unfeature').put('hide').put('unhide').put('lock').put('unlock').resource('likes').resource('comments').close().resource('drafts').close().resource('code_revisions').open()
// This resource links to the root hubs resource
.resource('hubs', { linkTo: 'hubs' }).close();

Papi.generateMarkdown = function () {
  var markdown = '';

  _lodash2['default'].each(Papi.resourceDefinitions, function (def) {
    markdown += '###' + def.model.name + '\n\n';
    markdown += '**`' + def.key + '`**\n\n';

    if (def.parent) {
      markdown += '#####Parent\n\n';
      markdown += '- [' + def.parent.model.name + '](#' + def.parent.model.name.toLowerCase() + ') `' + def.parent.key + '`\n\n';
    }

    if (!_lodash2['default'].isEmpty(def.children)) {
      markdown += '#####Children\n\n';
      _lodash2['default'].each(def.children, function (child) {
        markdown += '- [' + child.model.name + '](#' + child.model.name.toLowerCase() + ') `' + child.key + '`\n';
      });
    }

    markdown += '\n\n';

    if (def.linkTo) {
      var linkTo = Papi.resourceDefinitions[def.linkTo];
      markdown += 'See [' + linkTo.model.name + '](#' + linkTo.model.name.toLowerCase() + ') `' + linkTo.key + '`\n\n';
    }

    var pathRoot = def.route.path.replace(/\/:.+$/, '');

    markdown += '#####REST Endpoints\n\n';

    markdown += '- `GET` ' + pathRoot + '\n';
    markdown += '- `POST` ' + pathRoot + '\n';
    markdown += '- `GET` ' + def.route.path + '\n';
    markdown += '- `PUT` ' + def.route.path + '\n';
    markdown += '- `DELETE` ' + def.route.path + '\n\n';

    if (!_lodash2['default'].isEmpty(def.actions)) {
      markdown += '*Additional Actions*\n\n';

      _lodash2['default'].each(def.actions, function (action) {
        markdown += '- `' + action.method.toUpperCase() + '` ' + def.route.path + '/' + action.name + '\n';
      });
    }

    markdown += '\n\n';
  });

  console.log(markdown);
};
module.exports = exports['default'];