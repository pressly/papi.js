/**
  * Papi JS client
  * ================
  **/

// The first version, just write it plan javascript..
// no fancy es6, just stick to the basics

// make sure to set window.superagent ...
// ie. when using with angular.......

// Dependencies.
var request = require('superagent');

// Tokens.
var devJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTQzODA0ZmIzZDNkOWQzNGI3MDAwMDAxIn0.Pcv9tTmQZnQNByS4ZItJwCIcbJ8xH-mRMPyzd-z6kGM';
var betaJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRkZTYxNjM0MmJjMzk0NzNkZDdjYmY4In0.VrSrFkbY09DRQZa0W4uWa5VFqyXZH37jqXZ8sny1-WE';
var alexJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRkZTYxNjM0MmJjMzk0NzNkZDdjYzA0In0.WhNAHf4h79w1jtkLSPYqvANOcJGnCIGY6iu3X6KfFzY';


/**
 * Search Provider
 *
 * Main wrapper for PAPI Search.
 */
function Provider(provider) {
  this.provider = provider;
};

/**
 * Search:
 *    GET /:provider/search?q=X
 *
 * @param {String} q - Search query
 */
Provider.prototype.search = function(q) {
  var userSearch = (q[0] == '@') ? true : false;
  if (!q) q = 'golang';

  if (userSearch) {
    return request
      .get(Papi.host + '/' + this.provider + '/user')
      .query({ username: q })
      .query({ jwt: Papi.jwtToken });
  }

  return request
    .get(Papi.host + '/' + this.provider + '/search')
    .query({ q: q })
    .query({ jwt: Papi.jwtToken });
};

/**
 * Profile:
 *    GET /:provider/profile/:cred
 *
 * @param {Object} cred - Papi credential
 */
Provider.prototype.profile = function(cred) {
  if (!cred) throw new Error('Credentials were not specified');

  return request
    .get(Papi.host + '/' + this.provider + '/profile/' + cred[0].id)
    .query({ jwt: Papi.jwtToken });
};

/**
 * Feed:
 *    GET /:provider/feed/:cred
 *
 * @param {Object} cred - Papi credential
 */
Provider.prototype.feed = function(cred) {
  if (!cred) throw new Error('Credentials were not specified');

  return request
    .get(Papi.host + '/' + this.provider + '/profile')
    .query({ username: username })
    .query({ jwt: Papi.jwtToken });
};

/**
 * Posts:
 *    GET /:provider/posts/:cred
 *
 * @param {Object} cred - Papi credential
 */
Provider.prototype.posts = function(cred) {
  if (!cred) throw new Error('Credentials were not specified');

  return request
    .get(Papi.host + '/' + this.provider + '/user')
    .query({ username: username })
    .query({ jwt: Papi.jwtToken });
};

/**
 * Post:
 *    GET /:provider/post/:cred?body=X
 *    POST /:provider/post/:cred {..obj..}
 *
 * @param {Object} cred - Papi credential
 */
Provider.prototype.post = function(cred) {
  if (!cred) throw new Error('Credentials were not specified');

  return request
    .get(Papi.host + '/' + this.provider + '/user')
    .query({ username: username })
    .query({ jwt: Papi.jwtToken });
};


/**
 * PAPI
 *
 * Pressly JS API.
 */
var Papi = {
  host: 'https://beta-api.pressly.com',
  jwtToken: null,
  credentials: null,

  auth: function(jwtToken) {
    this.jwtToken = jwtToken;
  },

  creds: function() {
    request.get(this.host + '/creds?jwt=' + this.jwtToken).end(function(res) {
      Papi.credentials = res.body;
      console.log('CREDS:', res.body);
    });
  },

  search: function(provider, q) {
    console.log('PAPI - Performing {' + provider + '} Search for: ' + q);
    return new Provider(provider).search(q);
  },

  profile: function(provider) {
    console.log('PAPI - Showing {' + provider + '} Profile creds');
    return new Provider(provider).profile(Papi.credentials[provider]);
  }
};

Papi.auth(alexJwtToken);
Papi.creds();

window.Papi = Papi;
module.exports = Papi;
