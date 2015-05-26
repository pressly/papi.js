'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var Account = (function (_Model) {
  function Account() {
    _classCallCheck(this, Account);

    if (_Model != null) {
      _Model.apply(this, arguments);
    }
  }

  _inherits(Account, _Model);

  return Account;
})(_model2['default']);

exports['default'] = Account;
module.exports = exports['default'];