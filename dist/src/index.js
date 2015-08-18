'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _resourceSchema = require('./resource-schema');

var _resourceSchema2 = _interopRequireDefault(_resourceSchema);

function hasXDomain() {
  return typeof window !== 'undefined' && window.xdomain != null;
}

var Papi = (function (_ResourceSchema) {
  _inherits(Papi, _ResourceSchema);

  function Papi() {
    var _this = this;

    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Papi);

    _ResourceSchema.apply(this, arguments);

    this.options = options;
    this.options.host = options.host || 'https://beta-api.pressly.com';

    if (hasXDomain()) {
      var slaves = {};
      slaves[this.options.host] = '/proxy.html';
      window.xdomain.slaves(slaves);
    }

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

  // <= IE10, does not support static method inheritance

  Papi.prototype.request = function request(method, path) {
    var _this2 = this;

    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

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
      if (typeof req.withCredentials == 'function' && !hasXDomain()) {
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
  };

  // Register callback to fire after each request finishes
  // returns a deregister function.

  Papi.prototype.on = function on(callback) {
    var _this3 = this;

    this.callbacks.push(callback);

    return function () {
      _this3.off(callback);
    };
  };

  Papi.prototype.off = function off(callback) {
    var idx = this.callbacks.indexOf(callback);

    if (idx >= 0) {
      this.callbacks.splice(idx, 1);
    }
  };

  return Papi;
})(_resourceSchema2['default']);

exports['default'] = Papi;
if (Papi.defineSchema == undefined) {
  Papi.defineSchema = _resourceSchema2['default'].defineSchema;
}

Papi.defineSchema().resource('accounts').open().post('become', { on: 'member' }).resource('users').resource('hubs', { linkTo: 'hubs' }).close().resource('organizations').open().resource('users').resource('hubs', { linkTo: 'hubs' }).resource('invites').close().resource('hubs').open().get('search', { on: 'resource' }).post('upgrade', { on: 'member' }).post('accept_invite', { on: 'member' }).post('reject_invite', { on: 'member' }).resource('apps').open().get('current', { on: 'resource', path: '/current' }).get('build', { on: 'member', path: '/build_app' }).get('status', { on: 'member' }).resource('styles').close().resource('analytics').open().get('summary', { on: 'resource' }).get('visitors', { on: 'resource' }).get('pageviews', { on: 'resource' }).get('duration', { on: 'resource' }).close().resource('feeds').open().resource('assets', { modelName: 'FeedAsset' }).close().resource('invites').open().post('bulk_invite', { on: 'resource' }).post('resend', { on: 'member' }).post('accept', { on: 'member', routeSegment: '/invites/:hash' }).post('reject', { on: 'member', routeSegment: '/invites/:hash' }).close().resource('recommendations').resource('users').open().post('grant_access', { on: 'resource' })['delete']('revoke_access', { on: 'member' }).close().resource('collections').open().put('reorder', { on: 'resource' }).close().resource('tags').resource('assets', { routeSegment: '/stream/:id' }).open().put('feature', { on: 'member' }).put('unfeature', { on: 'member' }).put('hide', { on: 'member' }).put('unhide', { on: 'member' }).put('lock', { on: 'member' }).put('unlock', { on: 'member' }).resource('likes').resource('comments').close().resource('drafts').open().put('publish', { on: 'member' }).close().close().resource('invites').open().get('incoming', { on: 'resource' }).get('outgoing', { on: 'resource' }).post('bulk_invite', { on: 'resource' }).post('resend', { on: 'member' }).post('accept', { on: 'member', key: 'hash' }).post('reject', { on: 'member', key: 'hash' }).close().resource('code_revisions').open().get('fetch_repo', { on: 'member' })

// This resource links to the root hubs resource
.resource('hubs', { linkTo: 'hubs' }).close().resource('signup').open().get('account_uid_available', { on: 'member' }).get('account_email_available', { on: 'member' }).close().resource('users').open().get('roles', { on: 'resource' }).close();
module.exports = exports['default'];