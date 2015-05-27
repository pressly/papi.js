'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var DISPLAY_STATES = {
  VISIBLE: 1,
  FEATURED: 2,
  HIGHLIGHTED: 4,
  LOCKED: 8
};

var Asset = (function (_Model) {
  function Asset() {
    _classCallCheck(this, Asset);

    if (_Model != null) {
      _Model.apply(this, arguments);
    }
  }

  _inherits(Asset, _Model);

  _createClass(Asset, [{
    key: 'isVisible',
    value: function isVisible() {
      return (this.display_state & DISPLAY_STATES.VISIBLE) === DISPLAY_STATES.VISIBLE;
    }
  }, {
    key: 'isHidden',
    value: function isHidden() {
      return (this.display_state & DISPLAY_STATES.VISIBLE) !== DISPLAY_STATES.VISIBLE;
    }
  }, {
    key: 'isFeatured',
    value: function isFeatured() {
      return (this.display_state & DISPLAY_STATES.FEATURED) === DISPLAY_STATES.FEATURED;
    }
  }, {
    key: 'isHighlighted',
    value: function isHighlighted() {
      return (this.display_state & DISPLAY_STATES.HIGHLIGHTED) === DISPLAY_STATES.HIGHLIGHTED;
    }
  }, {
    key: 'isLocked',
    value: function isLocked() {
      return (this.display_state & DISPLAY_STATES.LOCKED) === DISPLAY_STATES.LOCKED;
    }
  }, {
    key: 'isOriginal',
    value: function isOriginal() {
      return _lodash2['default'].chain(this.source).pick('network', 'uid', 'url').all(_lodash2['default'].isEmpty).value();
    }
  }]);

  return Asset;
})(_model2['default']);

exports['default'] = Asset;
module.exports = exports['default'];