'use strict';

import _ from 'lodash';
import request from 'superagent';
import Promise from 'bluebird';

import Resource, { applyResourcing } from './resource';

export default class Papi {
  constructor(domain = 'https://beta-api.pressly.com', jwt = null) {
    this.domain = domain;

    this.auth = {
      session: null,

      get: () => {
        return this.$request('get', '/auth/session').then((res) => {
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
        return this.$request('post', '/login', { data: { email, password } }).then((res) => {
          return this.auth.set(res.body);
        });
      },

      logout: () => {
        return this.$request('get', '/auth/logout').then((res) => {
          this.auth.session = null;

          return res;
        });
      }
    }
  }

  /*
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

  $request(method, path, options = {}) {
    return new Promise((resolve, reject) => {
      var url = /^(https?:)?\/\//.test(path) ? path : this.domain + path;
      var req = request[method](url);
      req.set('Content-Type', 'application/json');

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
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }
}

applyResourcing(Papi);

Papi
  .resource('auth')

  .resource('accounts').open()
    .resource('users')
    .resource('hubs')
  .close()

  .resource('hubs').open()
    .post('upgrade')
    .get('search', {on: 'collection'})

    .resource('apps').open()
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
      .resource('likes')
      .resource('comments')

      .put('feature')
      .put('unfeature')

      .put('hide')
      .put('unhide')

      .put('lock')
      .put('unlock')
    .close()

    .resource('drafts')
  .close()

  .resource('code_revisions').open()
    .resource('hubs')
  .close()
