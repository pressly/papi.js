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

var FeedAsset = (function (_Model) {
  function FeedAsset() {
    _classCallCheck(this, FeedAsset);

    if (_Model != null) {
      _Model.apply(this, arguments);
    }
  }

  _inherits(FeedAsset, _Model);

  return FeedAsset;
})(_model2['default']);

exports['default'] = FeedAsset;
module.exports = exports['default'];