'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _simpleJsonValidator = require('simple-json-validator');

var _simpleJsonValidator2 = _interopRequireDefault(_simpleJsonValidator);

var Resource = (function () {
  function Resource(session, route) {
    _classCallCheck(this, Resource);

    this.session = session;
    this.route = route;
    this.params = null;
    this.reRouteParams = /:[^\/:]+/gi;
  }

  _createClass(Resource, [{
    key: '$all',
    value: function $all() {
      var _this = this;

      var params = arguments[0] === undefined ? null : arguments[0];

      return new _Promise(function (resolve, reject) {
        try {
          _this.params = params;

          _superagent2['default'].get('' + _this.buildRoute()).set('Content-Type', 'application/json').set('Authorization', 'Bearer ' + _this.session.jwt).end(function (err, res) {
            if (err) {
              return reject(err);
            }

            resolve(res);
          });
        } catch (err) {
          return reject(err);
        }
      });
    }
  }, {
    key: '$find',
    value: function $find(id) {
      var _this2 = this;

      return new _Promise(function (resolve, reject) {
        try {
          _this2.params = { id: id };

          _superagent2['default'].get('' + _this2.buildRoute()).set('Content-Type', 'application/json').set('Authorization', 'Bearer ' + _this2.session.jwt).send(_this2.params).end(function (err, res) {
            if (err) {
              return reject(err);
            }

            resolve(res);
          });
        } catch (err) {
          return reject(err);
        }
      });
    }
  }, {
    key: '$save',
    value: function $save(resource) {
      var _this3 = this;

      return new _Promise(function (resolve, reject) {
        try {
          _this3.params = { id: resource.id };

          _superagent2['default'].put('' + _this3.buildRoute()).set('Content-Type', 'application/json').set('Authorization', 'Bearer ' + _this3.session.jwt).send(resource).end(function (err, res) {
            if (err) {
              return reject(err);
            }

            resolve(res);
          });
        } catch (err) {
          return reject(err);
        }
      });
    }
  }, {
    key: 'buildRoute',
    value: function buildRoute() {
      var _this4 = this;

      var finalRoute = '',
          paramsArray = this.parseRouteParams(),
          routeSegments = this.route.split(':');

      // map params to route segments
      _lodash2['default'].each(routeSegments, function (segment, index) {
        if (_lodash2['default'].contains(paramsArray, segment)) {
          if (_this4.params) {
            routeSegments[index] = _this4.params[segment];
            delete _this4.params[segment]; // remove from global params
          } else {
            routeSegments[index] = '';
          }
        }
      });

      // concat segments
      finalRoute = '' + this.session.domain + '' + routeSegments.join('');

      // strip last char if forward slash
      if (finalRoute.substr(-1) === '/') finalRoute = finalRoute.substr(0, finalRoute.length - 1);

      return finalRoute;
    }
  }, {
    key: 'parseRouteParams',
    value: function parseRouteParams() {
      return _lodash2['default'].map(this.route.match(this.reRouteParams), function (param) {
        return param.substr(1, param.length);
      });
    }
  }]);

  return Resource;
})();

exports['default'] = Resource;
module.exports = exports['default'];