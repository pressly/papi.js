'use strict'

import {map, each, filter, last, isObject, isArray, isEmpty} from 'lodash';

import Resource from './resource';
import * as models from './models/index';

function singularize(string) {
  return string.replace(/s$/, '');
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function classify(string) {
  return singularize(map(string.split("_"), function(s) { return capitalize(s); }).join(''));
}

// Builds a route object based on the resource chain
// ie: hubs > apps > styles =>
//   {
//     path: '/hubs/:hubId/apps/:appId/styles/:id',
//     segments: [ '/hubs/:hubId', '/apps/:appId', '/styles/:id' ],
//     segment: '/styles/:id',
//     params: { hubId: null, appId: null, id: null },
//     paramName: 'id'
//   }
var buildRoute = function(resource) {
  var current = resource;
  var segments = [];

  var path;

  if (current.options.route) {
    path = current.options.route;
  } else {
    // Build full path
    while (current) {
      // Get param for this segment - default to 'id'
      var paramName = current.options.routeSegment ? parseRouteParams(current.options.routeSegment)[0] : current.options.paramName || 'id';

      // If this segment is a parent segment prepend the param name with the segment name ie. 'id' -> 'hubId'
      if (current !== resource) {
        paramName = singularize(current.name) + capitalize(paramName);
      }

      // Create route segment from custom routeSegment property or default to name/param
      var routeSegment = current.options.routeSegment ? current.options.routeSegment.replace(/\/:[^\/]+$/, `/:${paramName}`) : `/${current.name}/:${paramName}`;

      segments.unshift(routeSegment);

      current = current.parent;
    }

    path = segments.join('');
  }

  var paramNames = parseRouteParams(path)
  var params = {};
  each(paramNames, function(paramName) {
    params[paramName] = null;
  });

  return {
    path,
    segments,
    segment: segments[segments.length - 1],
    params,
    paramNames,
    paramName: paramNames[paramNames.length - 1]
  };
};

// Parses params out of a route ie. /hubs/:hubId/apps/:appId/styles/:id => ['hubId', 'appId', 'id']
var reRouteParams = /:[^\/]+/gi;
var parseRouteParams = function(route) {
  return map(route.match(reRouteParams), function(param) {
    return param.slice(1);
  });
};

// Builds a key based on resource names ie. hubs.apps for the hubs > apps resource
var buildKey = function(resource, name) {
  var current = resource;
  var segments = [];

  while(current) {
    segments.unshift(current.name);
    current = current.parent
  }

  return segments.join('.');
}

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
      throw new Error("$resource: key is undefined");
    }

    var name = last(key.split('.'));
    var params = (isObject(arguments[1]) && !(arguments[1] instanceof Resource)) ? arguments[1] : undefined;
    var parentResource = arguments[2] || (!params && arguments[1]) || undefined;

    if (parentResource) {
      if (parentResource.children.indexOf(name) == -1) {
        throw new Error("$resource: key not found in parent resource.");
      }

      key = parentResource.key + '.' + name;
    }

    var resourceClass = this.constructor.resourceClasses[key];

    if (typeof resourceClass == 'undefined') {
      throw new Error(`$resource: key '${key}' does not exist in schema.`);
    }

    return new resourceClass(this, parentResource).includeParams(params);
  }

  $() {
    return this.$resource(...arguments)
  }
};

ResourceSchema.defineSchema = function() {
  var API = this;

  API.models = models;
  API.resourceClasses = {};

  var pointer = function (bucket, parentPointer) {
    return {
      current: null,

      resource: function (name, options) {
        options = (options || {});
        var parent = parentPointer ? parentPointer.current : null

        var def = { name: name, parent: parent, children: {}, options: options };

        if (options.link) {
          def.link = options.link;
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

        API.resourceClasses[def.key] = resourceClass;

        return this;
      },

      open: function() {
        return pointer(this.current.children, this);
      },

      close: function() {
        return parentPointer;
      },

      action: function(method, name, options) {
        var action = { method, name, options };

        if (action.options.routeSegment) {
          action.options.paramName = parseRouteParams(action.options.routeSegment)[0];
        }

        if (parentPointer && parentPointer.current) {
          parentPointer.current.actions.push(action);
        }

        var resourceClass = API.resourceClasses[parentPointer.current.key];

        if (options.on == 'resource') {
          if (!resourceClass.prototype.hasOwnProperty('$' + name)) {
            //console.log(`- adding collection action to ${parentPointer.current.key}:`, method, name, options);

            resourceClass.prototype['$' + name] = function(data = {}) {
              return this.request(Object.assign({ method, action }, { data })).then((res) => {
                if (isArray(res)) {
                  return this.hydrateCollection(res);
                } else {
                  return this.hydrateModel(res);
                }
              });
            };
          } else {
            throw `Attempted to create an action '${name}' that already exists.`;
          }
        } else if (options.on == 'member') {
          if (!resourceClass.prototype.hasOwnProperty('$' + name)) {
            //console.log(`- adding member action to ${parentPointer.current.key}:`, method, name, options);

            resourceClass.prototype['$' + name] = function(data = {}) {
              return this.request(Object.assign({ method, action }, { data })).then((res) => {
                return this.hydrateModel(res);
              });
            };

            resourceClass.modelClass.prototype['$' + name] = function(data = {}) {
              return this.$resource()['$' + name](data);
            };
          } else {
            throw `Attempted to create an action '${name}' that already exists.`;
          }
        }

        return this;
      },

      get: function() {
        return this.action.apply(this, ['get', ...arguments]);
      },

      post: function() {
        return this.action.apply(this, ['post', ...arguments]);
      },

      put: function() {
        return this.action.apply(this, ['put', ...arguments]);
      },

      patch: function() {
        return this.action.apply(this, ['patch', ...arguments]);
      },

      delete: function() {
        return this.action.apply(this, ['delete', ...arguments]);
      }
    };
  };

  return Object.assign({}, pointer({}));
};

// ResourceSchema.generateMarkdown = function() {
//   var API = this;
//   let markdown = "";
//
//   each(API.resourceClasses, (resourceClass) => {
//     var def = resourceClass.definition;
//
//     markdown += `###${def.modelName}\n\n`;
//     markdown += `**\`${def.key}\`**\n\n`;
//
//     if (def.parent) {
//       markdown += '#####Parent\n\n';
//       markdown += `- [${def.parent.modelName}](#${def.parent.modelName.toLowerCase()}) \`${def.parent.key}\`\n\n`;
//     }
//
//     if (!isEmpty(def.children)) {
//       markdown += '#####Children\n\n';
//       each(def.children, (child) => {
//         markdown += `- [${child.modelName}](#${child.modelName.toLowerCase()}) \`${child.key}\`\n`;
//       });
//     }
//
//     markdown += '\n\n';
//
//     if (def.link) {
//       let link = API.resourceClasses[def.link].definition;
//       markdown += `See [${link.modelName}](#${link.modelName.toLowerCase()}) \`${link.key}\`\n\n`;
//     }
//
//     let pathRoot = def.route.path.replace(/\/:.+$/, '');
//
//     markdown += '#####REST Endpoints\n\n';
//
//     markdown += `- \`GET\` ${pathRoot}\n`;
//     markdown += `- \`POST\` ${pathRoot}\n`;
//     markdown += `- \`GET\` ${def.route.path}\n`;
//     markdown += `- \`PUT\` ${def.route.path}\n`;
//     markdown += `- \`DELETE\` ${def.route.path}\n\n`;
//
//     if (!isEmpty(def.actions)) {
//       let memberActions = filter(def.actions, (action) => {
//         return action.options.on == 'member';
//       });
//
//       let collectionActions = filter(def.actions, (action) => {
//         return action.options.on == 'collection';
//       });
//
//
//       if (!isEmpty(collectionActions)) {
//         markdown += "*Collection Actions*\n\n";
//
//         each(collectionActions, (action) => {
//           markdown += `- \`${action.method.toUpperCase()}\` ${pathRoot}/${action.name}\n`
//         });
//       }
//
//       markdown += "\n\n";
//
//       if (!isEmpty(memberActions)) {
//         markdown += "*Member Actions*\n\n";
//
//         each(memberActions, (action) => {
//           markdown += `- \`${action.method.toUpperCase()}\` ${def.route.path}/${action.name}\n`
//         });
//       }
//     }
//
//     markdown += "\n\n";
//   });
//
//   console.log(markdown);
// };
