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
        return this.request('get', '/session').then((res) => {
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
        return this.request('post', '/auth/login', { data: { email, password } }).then((res) => {
          return this.auth.set(res.body);
        });
      },

      logout: () => {
        return this.request('delete', '/session').then((res) => {
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

      // Doesn't allow the delete keyword because it is reserved
      if (method == 'delete') {
        method = 'del';
      }

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

      req.set('Accept', 'application/vnd.pressly.v0.12+json')

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
    .post('become', { on: 'member' })

    .resource('users')
    .resource('hubs', { linkTo: 'hubs'})
  .close()

  .resource('organizations').open()
    .resource('users')
    .resource('hubs', { linkTo: 'hubs'})
  .close()

  .resource('hubs').open()
    .post('upgrade',  { on: 'member' })
    .get('search',    { on: 'collection' })
    .post('accept_invite', { on: 'member'})
    .post('reject_invite', { on: 'member'})

    .resource('apps').open()
      .get('current', { path: '/current', on: 'collection' })
      .get('build',   { path: '/build_app', on: 'member' })
      .get('status',  { on: 'member' })

      .resource('styles')
    .close()

    .resource('analytics').open()
      .get('summary',   { on: 'collection'})
      .get('visitors',  { on: 'collection'})
      .get('pageviews', { on: 'collection'})
      .get('duration',  { on: 'collection'})
    .close()

    .resource('feeds').open()
      .resource('assets', { modelName: 'FeedAsset' })
    .close()

    .resource('invites').open()
      .post('bulk_invite',  { on: 'collection' })
      .post('resend',       { on: 'member' })
      .post('accept',       { on: 'member' })
      .post('reject',       { on: 'member' })
    .close()

    .resource('recommendations')

    .resource('users').open()
      .post('grant_access',     { on: 'collection' })
      .delete('revoke_access',  { on: 'member' })
    .close()

    .resource('collections').open()
      .put('reorder', { on: 'collection'})
    .close()

    .resource('tags')

    .resource('assets', { routeSegment: '/stream/:id' }).open()
      .put('feature',   { on: 'member' })
      .put('unfeature', { on: 'member' })
      .put('hide',      { on: 'member' })
      .put('unhide',    { on: 'member' })
      .put('lock',      { on: 'member' })
      .put('unlock',    { on: 'member' })

      .resource('likes')
      .resource('comments')
    .close()

    .resource('drafts').open()
      .put('publish', { on: 'member' })
    .close()
  .close()

  .resource('code_revisions').open()
    .get('fetch_repo', { on: 'member' })

    // This resource links to the root hubs resource
    .resource('hubs', { linkTo: 'hubs' })
  .close()

  .resource('signup').open()
    .get('account_uid_available',   { on: 'member' })
    .get('account_email_available', { on: 'member' })
  .close()

  .resource('users').open()
    .get('roles', { on: 'collection' })
  .close()
;


Papi.generateMarkdown = () => {
  let markdown = "";

  _.each(Papi.resourceDefinitions, (def) => {
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
