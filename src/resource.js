'use strict'

import { each, map, filter, find, isNumber, isObject, isArray, isEmpty, clone } from './helpers'

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function singularize(string) {
  return string.replace(/s$/, '');
}

var toUnderscoreCase = function(str) {
	return str.replace(/([A-Z])/g, function($1){return "_" + $1.toLowerCase(); });
};

export default class Resource {
  constructor(api, parentResource, inherit = false) {
    var def = this.constructor.definition;
    if (typeof def == 'undefined') {
      throw new Error("Resource: Must supply a proper definition");
    }

    this.api = api;

    this.options = {};

    this.name = def.name;
    this.key = def.key;

    this.children = map(def.children, function(child, name) { return name; }) || [];

    this.depth = parentResource ? parentResource.depth + 1 : 1;

    this.route = deepClone(def.route);
    this.route.queryParams = {};

    this.actions = deepClone(def.actions);

    // Prepare route params, extends the route params from the parentResource
    if (parentResource) {
      var parentParams = {};

      each(parentResource.route.paramNames, (paramName) => {
        var parentParamName = paramName;
        if (parentResource.key != this.key && paramName == 'id') {
          parentParamName = singularize(parentResource.name) + 'Id';
        }

        parentParams[parentParamName] = parentResource.route.params[paramName];
      });

      Object.assign(this.route.params, parentParams);

      if (inherit) {
        this.route.queryParams = clone(parentResource.route.queryParams);
      }
    }

    this.parent = function() {
      return parentResource || (def.parent && this.api.$resource(def.parent.key)) || null;
    };
  }

  createResource(inherit = false) {
    return new this.constructor(this.api, this, inherit);
  }

  request(options = {}) {
    var path = options.action ? this.buildActionPath(options.action) : this.buildPath();

    return this.api.request(options.method || 'get', path, Object.assign({}, this.options, { query: Object.assign({}, this.route.queryParams, options.query), data: options.data })).then((res) => {
      this.setResponse(res);
      return res.data;
    });
  }

  buildPath() {
    var route = this.route.segments.join('');

    each(this.route.paramNames, (paramName) => {
      var value = this.route.params[paramName];
      if (!value && this.route.segments.length > 1 && paramName !== this.route.paramName) {
        throw new Error(`$resource: Can't make request because route was missing '${paramName}' param.`);
      }

      route = route.replace('/:' + paramName, value ? '/' + value : '');
    });

    return route;
  }

  buildActionPath(action) {
    var segments = this.route.segments;

    if (action.options.routeSegment) {
      segments.splice(segments.length - 1, 1, action.options.routeSegment);
    }

    var route = segments.join('');

    each(this.route.params, (value, paramName) => {
      route = route.replace('/:' + paramName, value ? '/' + value : '');
    });

    route += action.options.path ? action.options.path : `/${action.name}`;

    return route;
  }

  includeParams(params) {
    each(params, (value, paramName) => {
      if (this.route.params.hasOwnProperty(paramName)) {
        this.route.params[paramName] = value;
      } else {
        // Break out query params from route params
        this.route.queryParams[paramName] = value;
      }
    });

    return this;
  }

  query(params) {
    Object.assign(this.route.queryParams, params);

    return this;
  }

  limit(rpp) {
    this.query({limit: rpp});

    return this;
  }

  timeout(ms) {
    this.options.timeout = ms;

    return this;
  }

  $get(params) {
    var resource = this.createResource(true).includeParams(params);

    return resource.request().then((res) => {
      return resource.hydrateModel(res);
    });
  }

  $find(params) {
    if (params && !isObject(params)) {
      params = { id: params };
    }

    var resource = this.createResource(true).includeParams(params);

    return resource.request().then((res) => {
      return resource.hydrateModel(res);
    });
  }

  $all(params) {
    var resource = this.createResource(true).includeParams(params);

    return resource.request().then((res) => {
      return resource.hydrateCollection(res);
    });
  }

  $build(data = {}) {
    var resource = this.createResource();
    return resource.hydrateModel(data, { newRecord: !data[this.route.paramName] });
  }

  $create(data = {}) {
    return this.$build(data).$save();
  }

  setResponse(res) {
    this.status = res.status;
    this.headers = res.headers;
    this.links = res.links;
  }

  sync(data) {
    // Set route params based on data from the model
    // This is important step to take if the model queried from an all, queryParams, or action
    // Route param params are generally populated by the parent resources but sometimes
    // when hydrating a nested resourcewe will need to populate these properties from the raw data of the model
    each(Object.keys(this.route.params), (paramName) => {
      if (!this.route.params[paramName]) {
        // Data from the backend is in underscore case
        const param_name = toUnderscoreCase(paramName)
        this.route.params[paramName] = data[param_name]
      }
    })

    // XXX This will potentially cause conflict errors in the future
    // Update actions route params
    each(this.actions, (action) => {
      if (action.options.paramName) {
        this.route.params[action.options.paramName] = data[action.options.paramName];
      }
    });
  }

  hydrateModel(data, options = {}) {
    var model = new this.constructor.modelClass(data);

    this.sync(data);

    // By default the model $newRecord will be true
    if (!options.newRecord) {
      model.$newRecord = false;
    }

    // Set a reference to the resource on the model
    Object.defineProperty(model, '$resource', {
      enumerable: false,
      value: (name) => {
        if (isEmpty(name)) {
          return this;
        } else {
          return this.api.$resource(name, this);
        }
      }
    });

    return model;
  }

  hydrateCollection(data) {
    var collection = map(data, (item) => {
      // Models in a collection need a new resource created
      var resource = this.createResource();

      var model = resource.hydrateModel(item);

      return model;
    });


    var getPage = (page, options = {}) => {
      if (this.links && this.links.hasOwnProperty(page)) {
        return this.api.request('get', this.links[page]).then((res) => {
          if (options.append || options.prepend) {
            this.setResponse(res);

            var method = options.append ? 'push' : 'unshift';

            each(res.data, (item) => {
              collection[method](this.hydrateModel(item));
            });

            return collection;
          } else {
            this.setResponse(res);

            // Should create a new resource and hydrate
            return this.hydrateCollection(res.data);
          }
        });
      }
    }

    var methods = {
      $resource: () => {
        return this;
      },

      $nextPage: (options = {}) => {
        return getPage('next', options);
      },

      $prevPage: (options = {}) => {
        return getPage('prev', options);
      },

      $hasPage: (name) => {
        return this.links && this.links.hasOwnProperty(name);
      },

      $find: (id) => {
        return find(collection, (item) => {
          return item.id == id;
        });
      },

      $findWhere: (params) => {
        return find(collection, params);
      },

      $where: (params) => {
        return filter(collection, params);
      },

      $build: (data = {}) => {
        var resource = this.createResource();
        return resource.hydrateModel(data, { newRecord: !data[this.route.paramName] });
      },

      $create: (data = {}) => {
        return collection.$build(data).$save()
      },

      $add: (model = {}, idx, applySorting = false) => {
        if (typeof model == 'object' && !(model instanceof this.constructor.modelClass)) {
          model = collection.$build(model);
        }

        if (isNumber(idx)) {
          collection.splice(idx, 0, model);
        } else {
          collection.push(model);
        }

        if (applySorting) {
          collection.$sort();
        }

        return model;
      },

      $remove: (arg) => {
        // Remove multiples
        if (isArray(arg)) {
          var models = arg;
          each(models, (model) => {
            collection.$remove(model);
          })

          return models;
        }

        var idx;
        if (isNumber(arg)) {
          idx = arg;
        } else if (arg instanceof this.constructor.modelClass) {
          idx = collection.indexOf(arg);
        }

        if (idx >= 0 && idx < collection.length) {
          return collection.splice(idx, 1)[0];
        }
      },

      $reposition: (fromIdx, toIdx) => {
        if (fromIdx != toIdx && (fromIdx >= 0 && fromIdx < collection.length) && (toIdx >= 0 && toIdx < collection.length)) {
          var model = collection.$remove(fromIdx);

          if (model) {
            return collection.$add(model, toIdx, false);
          }
        }
      },

      $sort: () => {},

      $delete: (model, params = {}) => {
        if (model instanceof this.constructor.modelClass) {
          return model.$delete(params).then(() => {
            return collection.$remove(model);
          });
        }
      },

      $data: () => {
        return map(collection, (model) => model.$data())
      }
    };

    Object.assign(collection, methods);

    return collection;
  }
}
