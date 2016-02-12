'use strict';

exports.__esModule = true;

var _pick = require('lodash/pick');

var _pick2 = _interopRequireDefault(_pick);

var _functions = require('lodash/functions');

var _functions2 = _interopRequireDefault(_functions);

var _keys = require('lodash/keys');

var _keys2 = _interopRequireDefault(_keys);

var _difference = require('lodash/difference');

var _difference2 = _interopRequireDefault(_difference);

var _filter = require('lodash/filter');

var _filter2 = _interopRequireDefault(_filter);

var _assignIn = require('lodash/assignIn');

var _assignIn2 = _interopRequireDefault(_assignIn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Model = function () {
  function Model(data) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Model);

    (0, _assignIn2.default)(this, data);

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

      return (0, _assignIn2.default)(_this, res);
    });
  };

  Model.prototype.$attributes = function $attributes() {
    return (0, _filter2.default)((0, _difference2.default)((0, _keys2.default)(this), (0, _functions2.default)(this)), function (x) {
      return x[0] != '$';
    });
  };

  Model.prototype.$data = function $data() {
    return (0, _pick2.default)(this, this.$attributes());
  };

  return Model;
}();

exports.default = Model;