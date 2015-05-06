/**
  * Papi JS client
  * ================
  **/

// The first version, just write it plan javascript..
// no fancy es6, just stick to the basics

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
 * Search Provider
 *
 * Main wrapper for PAPI Search.
 */
function SearchProvider(network) {
  if (!network) throw new Error('PAPI: network is not defined')

  this.network = network;
};

/**
 * Search:
 *    GET /network/:network/search?q=X
 *    GET /network/:network/user?username=X
 *
 * @param {String} q - Search query
 */
SearchProvider.prototype.search = function(q) {
  if (!q) throw new Error('PAPI: Search Query is not defined')
  if (!Security.isSecurityenticated()) throw new Error('PAPI: unauthorized')

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
};

/**
 * Profile:
 *    GET /:network/profile/:cred
 *
 * @param {Object} cred - Papi credential
 */
SearchProvider.prototype.profile = function(cred) {
  if (!cred) throw new Error('PAPI: Credentials were not specified');

  return request
    .get(Papi.host + '/network/' + this.network + '/profile/' + cred[0].id)
    .query({ jwt: Papi.auth.jwt });
};


/**
 * Security
 */
function Security() { };

/**
 * Login:
 *    POST /login
 *
 * @param {Object} creds - Login credentials
 */
Security.prototype.login = function(creds) {
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
};

/**
 * Logout:
 *    GET /login
 *
 * @param {String} jwt - Jwt token
 */
Security.prototype.logout = function(jwt) {
  if (!jwt) throw new Error('PAPI Security: Unathorized')

  return $q.promise(function(resolve, reject) {
    request
      .get(Papi.host + '/auth/logout')
      .query({ jwt: jwt })
      .end(function(err, res) {
        if (res.status == 200) resolve(res.body);
      });
  });
};

/**
 * Session:
 *    GET /auth/session
 *
 * @param {String} jwt - Jwt token
 */
Security.prototype.session = function(jwt) {
  if (!jwt) throw new Error('PAPI Security: Unathorized')

  return $q.promise(function(resolve, reject) {
    request
      .get(Papi.host + '/auth/session')
      .query({ jwt: jwt })
      .end(function(err, res) {
        if (res.status == 200) resolve(res.body);
      });
  });
};





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
    this.jwt = jwt || alexJwtToken;
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

module.exports = Papi;

Papi.auth.login({ email: 'alex.vitiuk@pressly.com', password: 'betame' }).then(function(res) {
  console.log('LOGIN SUCCESS', res);

  Papi.auth.requestCurrentUser().then(function(res) {
    console.log('REQUEST CURR USERS SUCCESS', res)
  });

  /* LOGOUT
  Papi.auth.logout().then(function(res) {
    console.log('LOGOUT SUCCESS', res);
  });
  */
});

