'use strict';

exports.__esModule = true;

var _lodash = require('lodash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// var extend =      require('lodash/object/extend');
// var keys =        require('lodash/object/keys');
// var functions =   require('lodash/object/functions');
// var pick =        require('lodash/object/pick');
// var filter =      require('lodash/collection/filter');
// var difference =  require('lodash/array/difference');

var Model = function () {
  function Model(data) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Model);

    (0, _lodash.extend)(this, data);

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

      return (0, _lodash.extend)(_this, res);
    });
  };

  Model.prototype.$attributes = function $attributes() {
    return (0, _lodash.filter)((0, _lodash.difference)((0, _lodash.keys)(this), (0, _lodash.functions)(this)), function (x) {
      return x[0] != '$';
    });
  };

  Model.prototype.$data = function $data() {
    return (0, _lodash.pick)(this, this.$attributes());
  };

  return Model;
}();

exports.default = Model;