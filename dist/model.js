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

var Model = (function () {
  function Model(data) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Model);

    _lodash2['default'].extend(this, data);

    if (!options.persisted) {
      this.$newRecord = true;
    }
  }

  _createClass(Model, [{
    key: '$delete',
    value: function $delete() {
      return this.$resource().request({ method: 'delete' });
    }
  }, {
    key: '$save',
    value: function $save() {
      var _this = this;

      var method = this.$newRecord ? 'post' : 'put';

      return this.$resource().request({ method: method, data: this }).then(function (res) {
        delete _this.$newRecord;

        return _lodash2['default'].extend(_this, res);
      });
    }
  }]);

  return Model;
})();

exports['default'] = Model;
module.exports = exports['default'];