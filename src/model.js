'use strict'

import {assignIn, filter, pick, difference, keys, functions} from 'lodash';

export default class Model {
  constructor(data, options = {}) {
    assignIn(this, data);

    this.$newRecord = true;
  }

  $delete(params) {
    return this.$resource().request({ method: 'delete', query: params });
  }

  $save(params) {
    var method = this.$newRecord ? 'post' : 'put';

    return this.$resource().request({ method: method, data: this, query: params }).then((res) => {
      this.$newRecord = false;
      this.$resource().sync(res);

      return assignIn(this, res);
    });
  }

  $attributes() {
    return filter(difference(keys(this), functions(this)), (x) => { return x[0] != '$' });
  }

  $data() {
    return pick(this, this.$attributes());
  }
}
