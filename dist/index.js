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

    var domain = arguments[0] === undefined ? 'https://beta-api.pressly.com' : arguments[0];
    var jwt = arguments[1] === undefined ? null : arguments[1];

    _classCallCheck(this, Papi);

    this.domain = domain;

    this.auth = {
      session: null,

      get: function get() {
        return _this.$request('get', '/auth/session').then(function (res) {
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
        return _this.$request('post', '/login', { data: { email: email, password: password } }).then(function (res) {
          return _this.auth.set(res.body);
        });
      },

      logout: function logout() {
        return _this.$request('get', '/auth/logout').then(function (res) {
          _this.auth.session = null;

          return res;
        });
      }
    };
  }

  _createClass(Papi, [{
    key: '$resource',

    /*
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
    key: '$request',
    value: function $request(method, path) {
      var _this2 = this;

      var options = arguments[2] === undefined ? {} : arguments[2];

      return new _bluebird2['default'](function (resolve, reject) {
        var url = /^(https?:)?\/\//.test(path) ? path : _this2.domain + path;
        var req = _superagent2['default'][method](url);
        req.set('Content-Type', 'application/json');

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
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
    }
  }]);

  return Papi;
})();

exports['default'] = Papi;

(0, _resource.applyResourcing)(Papi);

Papi.resource('auth').resource('accounts').open().resource('users').resource('hubs').close().resource('hubs').open().post('upgrade').get('search', { on: 'collection' }).resource('apps').open().resource('styles').close().resource('feeds').open().resource('assets').close().resource('invites').resource('recommendations').resource('users').resource('collections').resource('tags').resource('assets', { routeSegment: '/stream/:id' }).open().resource('likes').resource('comments').put('feature').put('unfeature').put('hide').put('unhide').put('lock').put('unlock').close().resource('drafts').close().resource('code_revisions').open().resource('hubs').close();
module.exports = exports['default'];