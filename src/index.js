'use strict';

import _ from 'lodash';
import request from 'superagent';
import Promise from 'bluebird';

import Resource, { applyResourcing } from './resource';

export default class Papi {
  constructor(options = {}) {
    this.options = options;
    this.options.host = (options.host || 'https://beta-api.pressly.com');

    this.callbacks = [];

    this.auth = {
      session: null,

      get: () => {
        return this.request('get', '/auth/session').then((res) => {
          return this.auth.set(res.body);
        });
      },

      set: (session) => {
        if (!session.jwt) {
          throw new Error('Papi:Auth: Invalid session response - missing jwt');
        }

        this.auth.session = session;

        return this.auth.session;
      },

      isLoggedIn: () => {
        return !!this.auth.session && !this.auth.isExpired();
      },

      isExpired: () => {
        // XXX this should be using a jwt lib to figure out if the token has expired
        // XXX We do not currently include an expiry param in our tokens so just return false.
        return false;
      },

      login: (email, password) => {
        return this.request('post', '/login', { data: { email, password } }).then((res) => {
          return this.auth.set(res.body);
        });
      },

      logout: () => {
        return this.request('get', '/auth/logout').then((res) => {
          this.auth.session = null;

          return res;
        });
      }
    }
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

    return new Resource(this, key, parentResource).includeParams(params);
  }

  request(method, path, options = {}) {
    return new Promise((resolve, reject) => {
      var url = /^(https?:)?\/\//.test(path) ? path : this.options.host + path;
      var req = request[method](url);
      req.set('Content-Type', 'application/json');

      if (options.timeout || this.options.timeout) {
        req.timeout(options.timeout || this.options.timeout);
      }

      // Allow sending cookies from origin
      if (typeof req.withCredentials == 'function') {
        req.withCredentials();
      }

      // Send Authorization header when we have a JSON Web Token set in the session
      if (this.auth.session && this.auth.session.jwt) {
        req.set('Authorization', 'Bearer ' + this.auth.session.jwt)
      }

      // Query params to be added to the url
      if (options.query) {
        req.query(options.query);
      }

      // Data to send (with get requests these are converted into query params)
      if (options.data) {
        req.send(options.data);
      }

      req.end((err, res) => {
        setTimeout(() => {
          _.each(this.callbacks, (cb) => {
            cb(res);
          });
        });

        if (err) {
          return reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  // Register callback to fire after each request finishes
  // returns a deregister function.
  on(callback) {
    this.callbacks.push(callback);

    return () => {
      this.off(callback);
    };
  }

  off(callback) {
    let idx = this.callbacks.indexOf(callback);

    if (idx >= 0) {
      this.callbacks.splice(idx, 1);
    }
  }
}

applyResourcing(Papi);

Papi
  .resource('accounts').open()
    .resource('users')
    .resource('hubs')
  .close()

  .resource('hubs').open()
    .post('upgrade')
    .get('search', { on: 'collection' })

    .resource('apps').open()
      .get('current', { path: '/current' })

      .resource('styles')
    .close()

    .resource('feeds').open()
      .resource('assets')
    .close()

    .resource('invites')

    .resource('recommendations')

    .resource('users')

    .resource('collections')

    .resource('tags')

    .resource('assets', { routeSegment: '/stream/:id' }).open()
      .put('feature')
      .put('unfeature')
      .put('hide')
      .put('unhide')
      .put('lock')
      .put('unlock')

      .resource('likes')
      .resource('comments')
    .close()

    .resource('drafts')
  .close()

  .resource('code_revisions').open()
    // This resource links to the root hubs resource
    .resource('hubs', { linkTo: 'hubs' })
  .close()


Papi.generateMarkdown = () => {
  let markdown = "";

  _.each(Papi.resourceDefinitions, (def) => {
    markdown += `####${def.key}\n\n`;
    markdown += `model: \`${def.model.name}\`\n\n`;

    let pathRoot = def.route.path.replace(/\/:.+$/, '');

    markdown += `GET ${pathRoot}\n\n`;
    markdown += `POST ${pathRoot}\n\n`;
    markdown += `GET ${def.route.path}\n\n`;
    markdown += `PUT ${def.route.path}\n\n`;
    markdown += `DELETE ${def.route.path}\n\n`;

    _.each(def.actions, (action) => {
      markdown += `${action.method.toUpperCase()} ${def.route.path}/${action.name}\n\n`
    });

    if (!_.isEmpty(def.children)) {
      markdown += '**Associated Resources**\n\n';
      _.each(def.children, (child) => {
        markdown += `- [${child.name}](#${child.key.replace(/\./g, '')})\n`;
      });
    }

    markdown += "\n\n\n";
  });

  console.log(Papi.resourceDefinitions);

  console.log(markdown);
};
