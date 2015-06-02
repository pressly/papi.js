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

var Comment = (function (_Model) {
  function Comment() {
    _classCallCheck(this, Comment);

    if (_Model != null) {
      _Model.apply(this, arguments);
    }
  }

  _inherits(Comment, _Model);

  return Comment;
})(_model2['default']);

exports['default'] = Comment;
module.exports = exports['default'];