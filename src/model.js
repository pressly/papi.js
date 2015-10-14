'use strict'

import _ from 'lodash';

export default class Model {
  constructor(data, options = {}) {
    _.extend(this, data);

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

      return _.extend(this, res);
    });
  }

  $attributes() {
    return _.filter(_.difference(_.keys(this), _.functions(this)), (x) => { return x[0] != '$' });
  }

  $data() {
    return _.pick(this, this.$attributes());
  }
}
