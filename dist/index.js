'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _get = require('babel-runtime/helpers/get')['default'];

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

var _resourceSchema = require('./resource-schema');

var _resourceSchema2 = _interopRequireDefault(_resourceSchema);

var Papi = (function (_ResourceSchema) {
  function Papi() {
    var _this = this;

    var options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Papi);

    _get(Object.getPrototypeOf(Papi.prototype), 'constructor', this).apply(this, arguments);

    this.options = options;
    this.options.host = options.host || 'https://beta-api.pressly.com';

    this.callbacks = [];

    this.auth = {
      session: null,

      get: function get() {
        return _this.request('get', '/session').then(function (res) {
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
        return _this.request('post', '/auth/login', { data: { email: email, password: password } }).then(function (res) {
          return _this.auth.set(res.body);
        });
      },

      logout: function logout() {
        return _this.request('delete', '/session').then(function (res) {
          _this.auth.session = null;

          return res;
        });
      }
    };
  }

  _inherits(Papi, _ResourceSchema);

  _createClass(Papi, [{
    key: 'request',
    value: function request(method, path) {
      var _this2 = this;

      var options = arguments[2] === undefined ? {} : arguments[2];

      return new _bluebird2['default'](function (resolve, reject) {
        var url = /^(https?:)?\/\//.test(path) ? path : _this2.options.host + path;

        // Doesn't allow the delete keyword because it is reserved
        if (method == 'delete') {
          method = 'del';
        }

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

        req.set('Accept', 'application/vnd.pressly.v0.12+json');

        // Query params to be added to the url
        if (options.query) {
          req.query(options.query);
        }

        // Data to send (with get requests these are converted into query params)
        if (options.data) {
          req.send(options.data);
        }

        //console.log(req.url)

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
})(_resourceSchema2['default']);

exports['default'] = Papi;

Papi.defineSchema().resource('accounts').open().post('become', { on: 'member' }).resource('users').resource('hubs', { linkTo: 'hubs' }).close().resource('organizations').open().resource('users').resource('hubs', { linkTo: 'hubs' }).resource('invites').close().resource('hubs').open().get('search', { on: 'resource' }).post('upgrade', { on: 'member' }).post('accept_invite', { on: 'member' }).post('reject_invite', { on: 'member' }).resource('apps').open().get('current', { on: 'resource', path: '/current' }).get('build', { on: 'member', path: '/build_app' }).get('status', { on: 'member' }).resource('styles').close().resource('analytics').open().get('summary', { on: 'resource' }).get('visitors', { on: 'resource' }).get('pageviews', { on: 'resource' }).get('duration', { on: 'resource' }).close().resource('feeds').open().resource('assets', { modelName: 'FeedAsset' }).close().resource('invites').open().post('bulk_invite', { on: 'resource' }).post('resend', { on: 'member' }).post('accept', { on: 'member', routeSegment: '/invites/:hash' }).post('reject', { on: 'member', routeSegment: '/invites/:hash' }).close().resource('recommendations').resource('users').open().post('grant_access', { on: 'resource' })['delete']('revoke_access', { on: 'member' }).close().resource('collections').open().put('reorder', { on: 'resource' }).close().resource('tags').resource('assets', { routeSegment: '/stream/:id' }).open().put('feature', { on: 'member' }).put('unfeature', { on: 'member' }).put('hide', { on: 'member' }).put('unhide', { on: 'member' }).put('lock', { on: 'member' }).put('unlock', { on: 'member' }).resource('likes').resource('comments').close().resource('drafts').open().put('publish', { on: 'member' }).close().close().resource('invites').open().get('incoming', { on: 'resource' }).get('outgoing', { on: 'resource' }).post('bulk_invite', { on: 'resource' }).post('resend', { on: 'member' }).post('accept', { on: 'member', key: 'hash' }).post('reject', { on: 'member', key: 'hash' }).close().resource('code_revisions').open().get('fetch_repo', { on: 'member' })

// This resource links to the root hubs resource
.resource('hubs', { linkTo: 'hubs' }).close().resource('signup').open().get('account_uid_available', { on: 'member' }).get('account_email_available', { on: 'member' }).close().resource('users').open().get('roles', { on: 'resource' }).close();
module.exports = exports['default'];