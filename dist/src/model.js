'use strict';

exports.__esModule = true;

var _functions2 = require('lodash/functions');

var _functions3 = _interopRequireDefault(_functions2);

var _keys2 = require('lodash/keys');

var _keys3 = _interopRequireDefault(_keys2);

var _difference2 = require('lodash/difference');

var _difference3 = _interopRequireDefault(_difference2);

var _pick2 = require('lodash/pick');

var _pick3 = _interopRequireDefault(_pick2);

var _filter2 = require('lodash/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _assignIn2 = require('lodash/assignIn');

var _assignIn3 = _interopRequireDefault(_assignIn2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Model = function () {
  function Model(data) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Model);

    (0, _assignIn3.default)(this, data);

    this.$newRecord = true;
  }

  Model.prototype.$delete = function $delete(params) {
    return this.$resource().request({ method: 'delete', query: params });
  };

  Model.prototype.$save = function $save(params) {
    var _this = this;

    var method = this.$newRecord ? 'post' : 'put';

    return this.$resource().request({ method: method, data: this, query: params }).then(function (res) {
      _this.$newRecord = false;
      _this.$resource().sync(res);

      return (0, _assignIn3.default)(_this, res);
    });
  };

  Model.prototype.$attributes = function $attributes() {
    return (0, _filter3.default)((0, _difference3.default)((0, _keys3.default)(this), (0, _functions3.default)(this)), function (x) {
      return x[0] != '$';
    });
  };

  Model.prototype.$data = function $data() {
    return (0, _pick3.default)(this, this.$attributes());
  };

  return Model;
}();

exports.default = Model;