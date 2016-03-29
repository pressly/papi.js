'use strict'

export default class Model {
  constructor(data, options = {}) {
    Object.assign(this, data);

    Object.defineProperty(this, '$newRecord', {
      enumerable: false,
      writable: true,
      value: true
    });
  }

  $delete(params) {
    return this.$resource().request({ method: 'delete', query: params });
  }

  $save(params) {
    var method = this.$newRecord ? 'post' : 'put';

    return this.$resource().request({ method: method, data: this, query: params }).then((res) => {
      this.$newRecord = false;
      this.$resource().sync(res);

      return Object.assign(this, res);
    });
  }

  $attributes() {
    return Object.keys(this);
  }

  $data() {
    return this.$attributes().reduce((result, key) => { result[key] = this[key]; return result; }, {});
  }
}
