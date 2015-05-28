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

  return { path: path, segments: segments, mySegment: segments[segments.length - 1], params: params };
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

        resource.key = buildKey(resource);
        resource.route = buildRoute(resource);
        resource.model = options.model || models[classify(name)] || models.Base;

        this.current = bucket[name] = klass.resourceDefinitions[resource.key] = resource;

        return this;
      },

      // XXX Needs impl
      action: function(name, options) {
        return this;
      },

      open: function() {
        return pointer(this.current.children, this);
      },

      close: function() {
        return parentPointer;
      },

      get: function() {
        return this.action.apply(this, arguments);
      },

      post: function() {
        return this.action.apply(this, arguments);
      },

      put: function() {
        return this.action.apply(this, arguments);
      },

      patch: function() {
        return this.action.apply(this, arguments);
      },

      delete: function() {
        return this.action.apply(this, arguments);
      }
    };
  };

  _.extend(klass, pointer({}));
};


/** Resource class ************************************************************/

var extendPromise = function(parentPromise, parentResource, promises) {
  promises = (promises || [parentPromise]);

  return _.extend(parentPromise, {
    $resource: function(name) {
      var key = parentResource.key + '.' + name;

      var childResource = parentResource.api.$resource(key, parentResource);

      childResource._all = childResource.all;
      childResource._find = childResource.find;

      var result = _.extend(childResource, {
        all: function() {
          var promise = childResource._all();
          return Promise.all(promises.concat(promise));
        },

        find: function(id) {
          childResource.includeParams({id: id});
          var promise = childResource._find(id);
          var finalPromiseChain = Promise.all(promises.concat(promise));

          promises.push(promise);

          return extendPromise(finalPromiseChain, childResource, promises);
        }
      });

      return result;
    }
  });
};

export default class Resource {
  constructor(api, key, parentResource) {
    var def = api.constructor.resourceDefinitions[key];

    if (typeof def == 'undefined') {
      throw new Error("Resource: Must supply a proper definition");
    }

    this.api = api;

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
    }

    this.parent = function() {
      return parentResource || (def.parent && this.api.$resource(def.parent.key)) || null;
    };
  }

  buildRoute(applyParams) {
    var path = this.route.segments.join('');

    applyParams = (applyParams || false);

    if (applyParams == true) {
      _.each(this.route.params, (value, paramName) => {
        path = path.replace('/:' + paramName, value ? '/' + value : '');
      });
    }

    return path;
  }

  includeParams(params) {
    _.each(params, (value, paramName) => {
      if (this.route.params.hasOwnProperty(paramName)) {
        this.route.params[paramName] = value;
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

  find(params) {
    if (params && !_.isObject(params)) {
      params = { id: params };
    }

    // Create a new resource for this step of the chain with included parameters
    var resource = new Resource(this.api, this.key, this).includeParams(params);
    var path = resource.buildRoute(true);

    var promise = this.api.$request('get', path).then(function(res) {
      var model = resource.hydrateModel(res.body);

      return model;
    });

    return extendPromise(promise, resource);
  }

  all(params) {
    // Create a new resource for this step of the chain with included parameters
    var resource = new Resource(this.api, this.key, this).includeParams(params);
    var path = resource.buildRoute(true);

    return this.api.$request('get', path, { query: this.route.queryParams }).then(function(res) {
      var collection = _.map(res.body, function(item) { return resource.hydrateModel(item); });

      // Set a reference to the resource on the model
      collection.$resource = function(name) {
        if (_.isEmpty(name)) {
          return resource;
        } else {
          return resource.api.$resource(name, resource);
        }
      };

      return collection;
    });
  }

  save() {

  }

  update() {

  }

  delete() {

  }

  hydrateModel(data) {
    // Create a new resource for the model based on the current resource and maintain the parent relationship
    var resource = new Resource(this.api, this.key, this);
    var model = new resource.model(data);

    _.each(resource.route.params, function(value, paramName) {
      if (data[paramName]) {
        resource.route.params[paramName] = data[paramName] ;
      }
    });

    // Set a reference to the resource on the model
    model.$resource = function(name) {
      if (_.isEmpty(name)) {
        return resource;
      } else {
        return resource.api.$resource(name, resource);
      }
    };

    return model;
  }
}
