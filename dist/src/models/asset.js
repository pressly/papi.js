'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

//import {chain, all, isEmpty} from 'lodash';
var all = require('lodash/collection/all');
var pick = require('lodash/object/pick');
var isEmpty = require('lodash/lang/isEmpty');

var DISPLAY_STATES = {
  VISIBLE: 1,
  FEATURED: 2,
  HIGHLIGHTED: 4,
  LOCKED: 8
};

var Asset = (function (_Model) {
  _inherits(Asset, _Model);

  function Asset() {
    _classCallCheck(this, Asset);

    _Model.apply(this, arguments);
  }

  Asset.prototype.isVisible = function isVisible() {
    return (this.display_state & DISPLAY_STATES.VISIBLE) === DISPLAY_STATES.VISIBLE;
  };

  Asset.prototype.isHidden = function isHidden() {
    return (this.display_state & DISPLAY_STATES.VISIBLE) !== DISPLAY_STATES.VISIBLE;
  };

  Asset.prototype.isFeatured = function isFeatured() {
    return (this.display_state & DISPLAY_STATES.FEATURED) === DISPLAY_STATES.FEATURED;
  };

  Asset.prototype.isHighlighted = function isHighlighted() {
    return (this.display_state & DISPLAY_STATES.HIGHLIGHTED) === DISPLAY_STATES.HIGHLIGHTED;
  };

  Asset.prototype.isLocked = function isLocked() {
    return (this.display_state & DISPLAY_STATES.LOCKED) === DISPLAY_STATES.LOCKED;
  };

  Asset.prototype.isOriginal = function isOriginal() {
    return all(pick(this.source, 'network', 'uid', 'url'), isEmpty);
  };

  return Asset;
})(_model2['default']);

exports['default'] = Asset;
module.exports = exports['default'];