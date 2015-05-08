/**
  * Papi JS client
  * ================
  **/

// make sure to set window.superagent ...
// ie. when using with angular.......

// Dependencies.
var request = require('superagent')
  , _       = require('underscore')
  , $q      = require('q');

// Tokens.
var devJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTQzODA0ZmIzZDNkOWQzNGI3MDAwMDAxIn0.Pcv9tTmQZnQNByS4ZItJwCIcbJ8xH-mRMPyzd-z6kGM';
var betaJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTkwIn0.3dtaAt-WIyqi5LPT4EiHGFLiU2TDD6-_sWpwZwkqcHI';
var alexJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo';


/**
 * Search Provider.
 * Main wrapper for PAPI Search.
 */
function SearchProvider(network) {
  if (!network) throw new Error('PAPI: network is not defined')

  this.network = network;
};

SearchProvider.prototype = {
  constructor: SearchProvider,

  /**
   * Search:
   *    GET /network/:network/search?q=X
   *    GET /network/:network/user?username=X
   *
   * @param {String} q - Search query
   */
  search: function(q) {
    if (!q) throw new Error('PAPI: Search Query is not defined')

    var userSearch = (q[0] == '@')

    if (userSearch) {
      return request
        .get(Papi.host + '/network/' + this.network + '/user')
        .query({ username: q })
        .query({ jwt: Papi.auth.jwt });
    }

    return request
      .get(Papi.host + '/network/' + this.network + '/search')
      .query({ q: q })
      .query({ jwt: Papi.auth.jwt });
  },

  /**
   * Profile:
   *    GET /:network/profile/:cred
   *
   * @param {Object} cred - Papi credential
   */
  profile: function(cred) {
    if (!cred) throw new Error('PAPI: Credentials were not specified');

    return request
      .get(Papi.host + '/network/' + this.network + '/profile/' + cred[0].id)
      .query({ jwt: Papi.auth.jwt });
  }
};


/**
 * Security.
 */
function Security() { };

Security.prototype = {
  constructor: Security,

  /**
   * Login:
   *    POST /login
   *
   * @param {Object} creds - Login credentials
   */
  login: function(creds) {
    if (!creds) throw new Error('PAPI Security: Unathorized Login - Missing Login Credentials')
    if (!creds.email) throw new Error('PAPI Security: Unathorized Login - Missing Login Email')
    if (!creds.password) throw new Error('PAPI Security: Unathorized Login - Missing Login Password')

    return $q.promise(function(resolve, reject) {
      request
        .post(Papi.host + '/login')
        .send({ email: creds.email, password: creds.password })
        .end(function(err, res) {
          if (res.status == 200) resolve(res.body);
        });
    });
  },

  /**
   * Logout:
   *    GET /login
   *
   * @param {String} jwt - Jwt token
   */
  logout: function(jwt) {
    if (!jwt) throw new Error('PAPI Security: Unathorized')

    return $q.promise(function(resolve, reject) {
      request
        .get(Papi.host + '/auth/logout')
        .query({ jwt: jwt })
        .end(function(err, res) {
          if (res.status == 200) resolve(res.body);
        });
    });
  },

  /**
   * Session:
   *    GET /auth/session
   *
   * @param {String} jwt - Jwt token
   */
  session: function(jwt) {
    if (!jwt) throw new Error('PAPI Security: Unathorized')

    return $q.promise(function(resolve, reject) {
      request
        .get(Papi.host + '/auth/session')
        .query({ jwt: jwt })
        .end(function(err, res) {
          if (res.status == 200) resolve(res.body);
        });
    });
  }
};


/**
 * Resource.
 */
function Resource() {
  this.params = null;
};

Resource.prototype = {
  constructor: Resource,
  reRouteParams: /:[^\/:]+/gi,

  $all: function(params) {
    var self = this, params = params || {};
    this.params = _.extend(params, { jwt: Papi.auth.jwt });

    return $q.promise(function(resolve, reject) {
      request
        .get(Papi.host + self.buildRoute())
        .query(self.params)
        .end(function(err, res) {
          if (res.status == 200) resolve(res.body);
        });
    });
  },

  $find: function(id) {
    var self = this;
    this.params = _.extend({ id: id }, { jwt: Papi.auth.jwt });

    return $q.promise(function(resolve, reject) {
      request
        .get(Papi.host + self.buildRoute())
        .query(self.params)
        .end(function(err, res) {
          if (res.status == 200) resolve(res.body);
        });
    });
  },

  $save: function(resource) {
    var self = this;
    this.params = { id: resource.id };

    return $q.promise(function(resolve, reject) {
      request
        .put(Papi.host + self.buildRoute())
        .query({ jwt: Papi.auth.jwt })
        .send(resource)
        .end(function(err, res) {
          if (res.status == 200) resolve(res.body);
        });
    });
  },

  $saveAll: function(resources) {

  },

  $update: function(resource) {

  },

  parseRouteParams: function() {
    return _.map(this.route.match(this.reRouteParams), function(param) {
      return param.substr(1, param.length);
    });
  },

  buildRoute: function() {
    var self          = this
      , finalRoute    = ''
      , paramsArray   = this.parseRouteParams()
      , routeSegments = this.route.split(':');

    // map params to route segments
    _.each(routeSegments, function(segment, index) {
      if (_.contains(paramsArray, segment)) {
        routeSegments[index] = self.params[segment];

        delete self.params[segment]; // remove from global params
      }
    });

    // concat segments
    finalRoute = routeSegments.join('');

    // strip last char if forward slash
    if (finalRoute.substr(-1) === '/')
      finalRoute = finalRoute.substr(0, finalRoute.length - 1)

    return finalRoute;
  }
};

/**
 * Hub Resource.
 */
function HubResource() {
  this.route = '/hubs/:id:';
}
HubResource.prototype = new Resource();
HubResource.prototype.constructor = HubResource;

/**
 * Stream Asset Resource.
 */
function StreamAssetResource() {
  this.route = '/hubs/:hubId:/stream/:assetId:';
}
StreamAssetResource.prototype = new Resource();
StreamAssetResource.prototype.constructor = StreamAssetResource;

/**
 * User Resource.
 */
function UserResource() {
  this.route = '/users/:id:';
}
UserResource.prototype = new Resource();
UserResource.prototype.constructor = UserResource;



/**
 * PAPI
 *
 * Pressly JS API.
 */
var Papi = {
  host: 'https://beta-api.pressly.com',
  credentials: null,

  creds: function() {
    request.get(this.host + '/creds?jwt=' + this.auth.jwt).end(function(res) {
      Papi.credentials = res.body;
      console.log('CREDS:', res.body);
    });
  },

  loadHubs: function() {
    return request
      .get(this.host + '/hubs')
      .query({ jwt: this.auth.jwt });
  },

  loadAssets: function(hubId) {
    return request
      .get(this.host + '/hubs/' + hubId + '/stream')
      .query({ limit: 8 })
      .query({ jwt: this.auth.jwt });
  },

  search: function(network, q) {
    var res = null

    try {
      res = new SearchProvider(network).search(q)
    } catch (e) {
      console.error(e.message);
    }

    return res;
  },

  profile: function(network) {
    console.log('PAPI - Showing {' + network + '} Profile creds');
    return new SearchProvider(network).profile(Papi.credentials[network]);
  },

  imgry: function(url, width, height, op, fp, box) {
    var params = {
      url: url,
      size: (width || '') + 'x' + (height || ''),
      op: (op || 'balance')
    };

    if (fp)  { params.fp = _.toArray(fp).join(',') }
    if (box) { params.box = _.toArray(box).join(',') }

    // convert params into url hash
    imgryUrl = '//imgry.pressly.com/xx2/fetch?' + _(_(_(params).pairs()).map(function (e) {
      return _(e).join('=')
    })).join('&');

    return imgryUrl;
  }
};

Papi.auth = {
  jwt: null,
  security: new Security(),
  currentUser: null,

  setJwt: function(jwt) {
    return this.jwt = jwt || alexJwtToken;
  },

  login: function(creds) {
    var self = this;

    return $q.promise(function(resolve, reject) {
      try {
        self.security.login(creds).then(function(user) {
          if (!user.jwt) reject('missing jwt')
          resolve(self.setCurrentUser(user));
        });
      } catch (e) {
        console.error(e.message);
      }
    });
  },

  logout: function() {
    var self = this;

    return $q.promise(function(resolve, reject) {
      try {
        self.security.logout(self.jwt).then(function(res) {
          self.jwt = null
          self.currentUser = null
          resolve(res)
        });
      } catch (e) {
        console.error(e.message);
      }
    });
  },

  setCurrentUser: function(currentUser) {
    this.jwt = currentUser.jwt;
    return this.currentUser = currentUser;
  },

  requestCurrentUser: function() {
    var self = this;

    if (this.isAuthenticated()) {
      return $q.when(this.currentUser)
    } else {
      return $q.promise(function(resolve, reject) {
        try {
          self.security.session(self.jwt).then(function(currentUser) {
            resolve(self.setCurrentUser(currentUser));
          });
        } catch (e) {
          console.error(e.message);
        }
      })
    }
  },

  isAuthenticated: function() {
    return !!this.currentUser;
  },
};

Papi.hubs  = new HubResource();
Papi.users = new UserResource();
Papi.hubs.stream = new StreamAssetResource();

module.exports = Papi;

//
//
// TESTING
Papi.auth.login({ email: 'alex.vitiuk@pressly.com', password: 'betame' }).then(function(res) {
  /* LOGOUT
  Papi.auth.logout().then(function(res) {
    console.log('LOGOUT SUCCESS', res);
  });
  */

  // FIND ONE HUB
  Papi.hubs.$find('5540ed5d468bb00001000042').then(function(hub) {
    console.log("FIND HUB", hub);

    // HUB STREAM ASSETS
    Papi.hubs.stream.$all({ hubId: '5540ed5d468bb00001000042' }).then(function(assets) {
      console.log('STREAM ASSETS', assets);
    });

    // SAVE HUB
    Papi.hubs.$save(hub).then(function(savedHub) {
      console.log("SAVED HUB", savedHub);
    });
  });

  /* ALL HUBS
  Papi.hubs.$all().then(function(hubs) {
    console.log("ALL HUBS", hubs);
  });
  */


  /* ALL USERS
  Papi.users.$all().then(function(users) {
    console.log("ALL USERS", users);
  });
  */
});
