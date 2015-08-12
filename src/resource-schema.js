'use strict'

import _ from 'lodash';

import Resource from './resource';
import * as models from './models';

function singularize(string) {
  return string.replace(/s$/, '');
}

function classify(string) {
  return singularize(_.map(string.split("_"), function(s) { return _.capitalize(s); }).join(''));
}

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
        paramName = singularize(current.name) + _.capitalize(paramName);
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

var pointer = function (bucket, parentPointer) {
  return {
    current: null,

    resource: function (name, options) {
      options = (options || {});
      var parent = parentPointer ? parentPointer.current : null

      var def = { name: name, parent: parent, children: {}, options: options };

      if (options.linkTo) {
        def.linkTo = options.linkTo;
      }

      def.key = buildKey(def);
      def.route = buildRoute(def);
      def.actions = [];
      def.modelName = options.modelName || classify(name);

      this.current = bucket[name] = def;

      // create a class for this specific resource and assign the definition
      var resourceClass = class extends Resource {
        constructor() {
          super(...arguments);
        }
      }

      resourceClass.definition = def;
      resourceClass.modelClass = models[def.modelName] || models.Base;

      ResourceSchema.resourceClasses[def.key] = resourceClass;

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

      if (options.on == 'resource') {
        var resourceClass = ResourceSchema.resourceClasses[parentPointer.current.key];

        if (!resourceClass.prototype.hasOwnProperty('$' + name)) {
          //console.log(`- adding collection action to ${parentPointer.current.key}:`, method, name);

          resourceClass.prototype['$' + name] = function(data = {}) {
            return this.request(_.extend({ method: method, path: options.path || `/${name}`}, data)).then((res) => {
              if (_.isArray(res)) {
                return this.hydrateCollection(res);
              } else {
                return this.hydrateModel(res);
              }
            });
          };
        }
      } else if (options.on == 'member') {
        var modelClass = ResourceSchema.resourceClasses[parentPointer.current.key].modelClass;

        if (!modelClass.prototype.hasOwnProperty('$' + name)) {
          //console.log(`- adding member action to ${parentPointer.current.key}:`, method, name);

          modelClass.prototype['$' + name] = function(data = {}) {
            return this.$resource().request(_.extend({ method: method, path: options.path || `/${name}`}, data)).then((res) => {
              return this.$resource().hydrateModel(res);
            });
          }
        }
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

export default class ResourceSchema {
  constructor() {
  }

  /*
    Resource selector

    $resource();
    $resource(key);
    $resource(key, params);
    $resource(name, parentResource);
    $resource(name, params, parentResource);
  */
  $resource() {
    var key = arguments[0];

    if (typeof key == 'undefined') {
      throw new Error("Papi::$resource: key is undefined");
    }

    var name = _.last(key.split('.'));
    var params = (_.isObject(arguments[1]) && !(arguments[1] instanceof Resource)) ? arguments[1] : undefined;
    var parentResource = arguments[2] || (!params && arguments[1]) || undefined;

    if (parentResource) {
      if (parentResource.children.indexOf(name) == -1) {
        throw new Error("Papi::$resource: key not found in parent resource.");
      }

      key = parentResource.key + '.' + name;
    }

    return new this.constructor.resourceClasses[key](this, parentResource).includeParams(params);
  }
};

ResourceSchema.resourceClasses = {};
_.extend(ResourceSchema, pointer({}));

ResourceSchema.generateMarkdown = () => {
  let markdown = "";

  _.each(Papi.resourceClasses, (resourceClass) => {
    var def = resourceClass.definition;

    markdown += `###${def.model.name}\n\n`;
    markdown += `**\`${def.key}\`**\n\n`;

    if (def.parent) {
      markdown += '#####Parent\n\n';
      markdown += `- [${def.parent.model.name}](#${def.parent.model.name.toLowerCase()}) \`${def.parent.key}\`\n\n`;
    }

    if (!_.isEmpty(def.children)) {
      markdown += '#####Children\n\n';
      _.each(def.children, (child) => {
        markdown += `- [${child.model.name}](#${child.model.name.toLowerCase()}) \`${child.key}\`\n`;
      });
    }

    markdown += '\n\n';

    if (def.linkTo) {
      let linkTo = Papi.resourceDefinitions[def.linkTo];
      markdown += `See [${linkTo.model.name}](#${linkTo.model.name.toLowerCase()}) \`${linkTo.key}\`\n\n`;
    }

    let pathRoot = def.route.path.replace(/\/:.+$/, '');

    markdown += '#####REST Endpoints\n\n';

    markdown += `- \`GET\` ${pathRoot}\n`;
    markdown += `- \`POST\` ${pathRoot}\n`;
    markdown += `- \`GET\` ${def.route.path}\n`;
    markdown += `- \`PUT\` ${def.route.path}\n`;
    markdown += `- \`DELETE\` ${def.route.path}\n\n`;

    if (!_.isEmpty(def.actions)) {
      let memberActions = _.select(def.actions, (action) => {
        return action.options.on == 'member';
      });

      let collectionActions = _.select(def.actions, (action) => {
        return action.options.on == 'collection';
      });


      if (!_.isEmpty(collectionActions)) {
        markdown += "*Collection Actions*\n\n";

        _.each(collectionActions, (action) => {
          markdown += `- \`${action.method.toUpperCase()}\` ${pathRoot}/${action.name}\n`
        });
      }

      markdown += "\n\n";

      if (!_.isEmpty(memberActions)) {
        markdown += "*Member Actions*\n\n";

        _.each(memberActions, (action) => {
          markdown += `- \`${action.method.toUpperCase()}\` ${def.route.path}/${action.name}\n`
        });
      }
    }

    markdown += "\n\n";
  });

  console.log(markdown);
};
