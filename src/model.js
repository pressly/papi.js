'use strict'

import _ from 'lodash';

export default class Model {
  constructor(data, options = {}) {
    _.extend(this, data);

    if (!options.persisted) {
      this.$newRecord = true;
    }
  }

  $delete() {
    return this.$resource().request({ method: 'delete' });
  }

  $save() {
    var method = this.$newRecord ? 'post' : 'put';

    return this.$resource().request({ method: method, data: this }).then((res) => {
      delete this.$newRecord;

      return _.extend(this, res);
    });
  }
}
