'use strict'

import _ from 'lodash';

import * as models from './models';


/** Utility tools *************************************************************/

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function singularize(string) {
  return string.replace(/s$/, '');
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function decapitalize(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

function pluralize(string) {
  return string + 's';
}

function classify(string) {
  return singularize(_.map(string.split("_"), function(s) { return capitalize(s); }).join(''));
}

/** Api Helpers ***************************************************************/

var buildRoute = function(resource) {
  var current = resource;
  var segments = [];

  var path;

  if (current.options.route) {
    path = current.options.route;
  } else {

    while (current) {
      var paramName = current.options.routeSegment ? parseRouteParams(current.options.routeSegment)[0] : current.options.paramName || 'id';

      if (current !== resource) {
        paramName = singularize(current.name) + capitalize(paramName);
      }

      var routeSegment = current.options.routeSegment ? current.options.routeSegment.replace(/\/:[^\/]+$/, `/:${paramName}`) : `/${current.name}/:${paramName}`;

      segments.unshift(routeSegment);

      current = current.parent;
    }

    path = segments.join('');
  }

  var params = {};
  _.each(parseRouteParams(path), function(paramName) {
    params[paramName] = null;
  });

  return { path: path, segments: segments, segment: segments[segments.length - 1], params: params, paramName: resource.options.paramName || 'id' };
};

var reRouteParams = /:[^\/]+/gi;
var parseRouteParams = function(route) {
  return _.map(route.match(reRouteParams), function(param) {
    return param.slice(1);
  });
};

var buildKey = function(resource, name) {
  var current = resource;
  var segments = [];

  while(current) {
    segments.unshift(current.name);
    current = current.parent
  }

  return segments.join('.');
}

export function applyResourcing(klass) {
  klass.resourceDefinitions = {};

  var pointer = function (bucket, parentPointer) {
    return {
      current: null,

      resource: function (name, options) {
        options = (options || {});
        var parent = parentPointer ? parentPointer.current : null
        var resource = { name: name, parent: parent, children: {}, options: options };

        if (options.linkTo) {
          resource.linkTo = options.linkTo;
        }

        resource.key = buildKey(resource);
        resource.route = buildRoute(resource);
        resource.model = options.model || models[options.modelName] || models[classify(name)] || models.Base;
        resource.actions = [];

        this.current = bucket[name] = klass.resourceDefinitions[resource.key] = resource;

        return this;
      },

      open: function() {
        return pointer(this.current.children, this);
      },

      close: function() {
        return parentPointer;
      },

      action: function(method, name, options) {
        if (parentPointer && parentPointer.current) {
          parentPointer.current.actions.push({ method, name, options });
        }

        return this;
      },

      get: function() {
        return this.action.call(this, 'get', arguments[0], arguments[1]);
      },

      post: function() {
        return this.action.call(this, 'post', arguments[0], arguments[1]);
      },

      put: function() {
        return this.action.call(this, 'put', arguments[0], arguments[1]);
      },

      patch: function() {
        return this.action.call(this, 'patch', arguments[0], arguments[1]);
      },

      delete: function() {
        return this.action.call(this, 'delete', arguments[0], arguments[1]);
      }
    };
  };

  _.extend(klass, pointer({}));
};


/** Resource class ************************************************************/

var parseHTTPLinks = function(linksString) {
  var links = {};

  if (linksString && !_.isEmpty(linksString)) {
    _.each(linksString.split(','), function(link) {
      var [href, rel] = link.split(';');
      href = href.replace(/<(.*)>/, '$1').trim();
      rel = rel.replace(/rel="(.*)"/, '$1').trim();
      links[rel] = href;
    });
  }

  return links;
};

export default class Resource {
  constructor(api, key, parentResource, inherit = false) {
    var def = api.constructor.resourceDefinitions[key];

    if (!inherit && def.linkTo) {
      def = api.constructor.resourceDefinitions[def.linkTo];
    }

    if (typeof def == 'undefined') {
      throw new Error("Resource: Must supply a proper definition");
    }

    this.api = api;

    this.options = {};

    this.name = def.name;
    this.key = def.key;
    this.model = def.model;

    this.children = _.map(def.children, function(child, name) { return name; }) || [];

    this.depth = parentResource ? parentResource.depth + 1 : 1;

    this.route = deepClone(def.route);
    this.route.queryParams = {};

    // Prepare route params, extends the route params from the parentResource
    if (parentResource) {
      var parentParams = {};

      _.each(parentResource.route.params, (value, paramName) => {
        if (parentResource.key != this.key && paramName == 'id') {
          paramName = singularize(parentResource.name) + 'Id';
        }

        parentParams[paramName] = value;
      });

      _.extend(this.route.params, parentParams);

      if (inherit) {
        this.route.queryParams = _.clone(parentResource.route.queryParams);
      }
    }

    this.parent = function() {
      return parentResource || (def.parent && this.api.$resource(def.parent.key)) || null;
    };

    _.each(def.actions, (action) => {
      this[action.name] = (options = {}) => {
        return this.request(_.extend({ method: action.method, path: action.options.path || `/${action.name}`}, options)).then((res) => {
          return this.hydrateModel(res);
        });
      }
    });
  }

  request(options = {}) {
    return this.api.request(options.method || 'get', this.buildRoute(options.path), _.extend({}, this.options, { query: _.extend({}, this.route.queryParams, options.query), data: options.data })).then((res) => {
      this.setResponse(res);
      return res.body;
    });
  }

  buildRoute(appendPath) {
    var route = this.route.segments.join('');

    _.each(this.route.params, (value, paramName) => {
      route = route.replace('/:' + paramName, value ? '/' + value : '');
    });

    if (appendPath) {
      route += appendPath;
    }

    return route;
  }

  includeParams(params) {
    _.each(params, (value, paramName) => {
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
    _.extend(this.route.queryParams, params);

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

  get(params) {
    var resource = new Resource(this.api, this.key, this, true).query(params);
    var path = resource.buildRoute();

    return this.api.request('get', path, { query: resource.route.queryParams }).then((res) => {
      var model = resource.hydrateModel(res.body);

      return model;
    });
  }

  find(params) {
    if (params && !_.isObject(params)) {
      params = { id: params };
    }

    var resource = new Resource(this.api, this.key, this, true).includeParams(params);

    return resource.request().then((res) => {
      return resource.hydrateModel(res);
    });
  }

  all(params) {
    var resource = new Resource(this.api, this.key, this, true).includeParams(params);

    return resource.request().then((res) => {
      return resource.hydrateCollection(res);
    });
  }

  setResponse(res) {
    this.status = res.status;
    this.headers = res.headers;
    this.links = parseHTTPLinks(res.headers.link);
  }

  hydrateModel(data, options = {}) {
    var model = new this.model(data);

    if (!options.newRecord) {
      model.$newRecord = false;
    }

    // Set route params based on data from the model
    // This is important step to take if the model queried from an all, queryParams, or action
    if (data[this.route.paramName]) {
      this.route.params[this.route.paramName] = data[this.route.paramName];
    }

    // Set a reference to the resource on the model
    model.$resource = (name) => {
      if (_.isEmpty(name)) {
        return this;
      } else {
        return this.api.$resource(name, this);
      }
    };

    return model;
  }

  hydrateCollection(data) {
    var collection = _.map(data, (item) => {
      // Models in a collection need a new resource created
      var resource = new Resource(this.api, this.key, this);

      var model = resource.hydrateModel(item);

      return model;
    });

    var methods = {
      $resource: () => {
        return this;
      },

      getPage: (page, options = {}) => {
        if (this.links[page]) {
          return this.api.request('get', this.links[page]).then((res) => {
            if (options.append || options.prepend) {
              this.setResponse(res);

              var method = options.append ? 'push' : 'unshift';

              _.each(res.body, (item) => {
                collection[method](this.hydrateModel(item));
              });

              return collection;
            } else {
              // XXX Not implemented yet.
              // Should create a new resource and hydrate
              return [];
            }
          });
        }
      },

      nextPage: (options = {}) => {
        return collection.getPage('next', options);
      },

      prevPage: (options = {}) => {
        return collection.getPage('prev', options);
      },

      hasPage: (name) => {
        return !!this.links[name];
      },

      first: () => {
        return _.first(collection);
      },

      last: () => {
        return _.last(collection);
      },

      find: (id) => {
        return _.detect(collection, (item) => {
          return item.id == id;
        });
      },

      findWhere: (params) => {
        return _.findWhere(collection, params);
      },

      where: (params) => {
        return _.where(collection, params);
      },

      create: (data = {}) => {
        var resource = new Resource(this.api, this.key, this);

        var model = resource.hydrateModel(data, { newRecord: true });

        return model;
      },

      add: (model = {}, idx, applySorting = false) => {
        if (typeof model == 'object' && !(model instanceof this.model)) {
          model = collection.create(model);
        }

        if (_.isNumber(idx)) {
          collection.splice(idx, 0, model);
        } else {
          collection.push(model);
        }

        if (applySorting) {
          collection.sort();
        }

        return model;
      },

      remove: (arg) => {
        // Remove multiples
        if (_.isArray(arg)) {
          var models = arg;
          _.each(models, (model) => {
            collection.remove(model);
          })

          return models;
        }

        var idx;
        if (_.isNumber(arg)) {
          idx = arg;
        } else if (arg instanceof this.model) {
          idx = collection.indexOf(arg);
        }

        if (idx >= 0 && idx < collection.length) {
          return collection.splice(idx, 1)[0];
        }
      },

      reposition: (fromIdx, toIdx) => {
        if (fromIdx != toIdx && (fromIdx >= 0 && fromIdx < collection.length) && (toIdx >= 0 && toIdx < collection.length)) {
          var model = collection.remove(fromIdx);

          if (model) {
            return collection.add(model, toIdx, false);
          }
        }
      },

      sort: () => {},

      // save: () => {
      //   var promises = [];
      //
      //   for (var idx = 0; i < collection.length; i++) {
      //     var item = collection.at(idx);
      //     promises.push(item.save());
      //   }
      //
      //   return Promise.all(promises);
      // },

      // update: () => {},

      delete: (model, params = {}) => {
        if (model instanceof this.model) {
          model.delete(params).then(() => {
            return collection.remove(model);
          });
        }
      }
    };

    _.extend(collection, methods);

    return collection;
  }
}
