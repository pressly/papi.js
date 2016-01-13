'use strict'

import {extend, filter, pick, difference, keys, functions} from 'lodash';

export default class Model {
  constructor(data, options = {}) {
    extend(this, data);

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

      return extend(this, res);
    });
  }

  $attributes() {
    return filter(difference(keys(this), functions(this)), (x) => { return x[0] != '$' });
  }

  $data() {
    return pick(this, this.$attributes());
  }
}
