'use strict'

import _ from 'lodash';

import * as models from './models';

/* Utility tools */
var deepClone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

var singularize = function(string) {
  return string.replace(/s$/, '');
};

var capitalize = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

var decapitalize = function(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
};

var pluralize = function(string) {
  return string + 's';
};

var classify = function(string) {
  return singularize(_.map(string.split("_"), function(s) { return capitalize(s); }).join(''));
};

var buildRoute = function(resource) {
  var current = resource;

  var segments = ['/' + current.name + '/:' + (current.options.paramName || 'id')];

  while (current && (current = current.parent)) {
    var param = current.options.paramName ? singularize(current.name) + capitalize(current.options.paramName) : singularize(current.name) + 'Id';
    segments.unshift('/' + current.name + '/:' + param);
  }

  var path = segments.join('');
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

export function getNameFromKey(key) {
  var parts = key.split('.');
  return parts[parts.length - 1];
}

export function applyResourceHelpers(klass) {
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

var extendPromise = function(parentPromise, parentResource, promises) {
  promises = (promises || [parentPromise]);

  return _.extend(parentPromise, {
    $query: function(name) {
      var key = parentResource.key + '.' + name;

      var childResource = parentResource.api.$query(key, parentResource);

      childResource._all = childResource.$all;
      childResource._find = childResource.$find;

      var result = _.extend(childResource, {
        $all: function() {
          var promise = childResource._all();
          return Promise.all(promises.concat(promise));
        },

        $find: function(id) {
          childResource.includeParams({id: id});
          var promise = childResource._find(id);
          var finalPromiseChain = Promise.all([promises.concat(promise)]);

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

    var self = this;
    this.api = api;

    this.name = def.name;
    this.key = def.key;
    this.model = def.model;

    this.children = _.map(def.children, function(child, name) { return name; }) || [];

    this.depth = parentResource ? parentResource.depth + 1 : 1;

    this.route = deepClone(def.route);

    // Prepare route params, extends the route params from the parentResource
    if (parentResource) {
      var parentParams = {};

      _.each(parentResource.route.params, function(value, paramName) {
        if (parentResource.key != self.key && paramName == 'id') {
          paramName = singularize(parentResource.name) + 'Id';
        }

        parentParams[paramName] = value;
      });

      _.extend(this.route.params, parentParams);
    }

    this.parent = function() {
      return parentResource || (def.parent && this.api.$query(def.parent.key)) || null;
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

  $find(params) {
    var self = this;

    if (!_.isObject(params)) {
      params = { id: params };
    }

    // Create a new resource for this step of the chain with included parameters
    var resource = new Resource(this.api, this.key, this).includeParams(params);
    var path = resource.buildRoute(true);

    //console.log("$find:", path);

    var promise = this.api.$request('get', path).then(function(res) {
      var model = resource.hydrateModel(res.body);

      console.log(model);

      return model;
    });

    return extendPromise(promise, resource);
  }

  $all(params) {
    var self = this;

    // Create a new resource for this step of the chain with included parameters
    var resource = new Resource(this.api, this.key, this).includeParams(params);
    var path = resource.buildRoute(true);

    //console.log("$all:", path);

    return this.api.$request('get', path).then(function(res) {
      var collection = _.map(res.body, function(item) { return resource.hydrateModel(item); });
      collection.$resource = resource;

      return collection;
    });
  }

  $save() {

  }

  $update() {

  }

  $delete() {

  }

  hydrateModel(data) {
    var self = this;

    // Create a new resource for the model based on the current resource and maintain the parent relationship
    var resource = new Resource(this.api, this.key, this);
    var model = new resource.model(data);

    _.each(resource.route.params, function(value, paramName) {
      if (data[paramName]) {
        resource.route.params[paramName] = data[paramName] ;
      }
    });

    // Set a reference to the resource on the model
    model.$resource = resource;

    var methods = {
      $query: function(name) {
        return resource.api.$query(name, resource);
      }
    };

    _.each(Resource.extendableMethods, function(method) {
      methods[method] = function() {
        return resource[method].apply(resource, arguments);
      };
    });

    _.extend(model, methods);

    return model;
  }
}

Resource.extendableMethods = [
  '$save',
  '$update',
  '$delete'
];
