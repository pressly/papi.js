/**
  * Papi JS client
  * ================
  * 
  * GET /creds
  *  
  * GET /:provider/search?q=X
  * GET /:provider/user?username=X
  *  
  * GET /:provider/profile/:cred
  * GET /:provider/feed/:cred
  * GET /:provider/posts/:cred
  *  
  * GET /:provider/post/:cred?body=X
  * POST /:provider/post/:cred {..obj..}
  * 
  * Also:
  * - Authorization header with JWT token
  * 
  **/

// The first version, just write it plan javascript..
// no fancy es6, just stick to the basics

// make sure to set window.superagent ... 
// ie. when using with angular.......

var request = require("superagent");

var Papi = {
  // host: "http://localhost:5331",
  host: "https://beta-api.pressly.com",
  jwtToken: null,

  auth: function(jwtToken) {
    this.jwtToken = jwtToken;
  },

  creds: function() {
    request.get(this.host + "/creds?jwt="+this.jwtToken, function(err, res) {
      if (err) throw err;
      console.log(res.text);
    });
  },

  searchTwitter: function() {
    request.get(this.host + "/twitter/search?q=golang&jwt="+this.jwtToken, function(err, res) {
      if (err) throw err;
      console.log(res.text);
    });
    // hrmm.. should use promises......? and return a prompse..
    // would be nicer.......
  }
}

var devJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTQzODA0ZmIzZDNkOWQzNGI3MDAwMDAxIn0.Pcv9tTmQZnQNByS4ZItJwCIcbJ8xH-mRMPyzd-z6kGM';
var betaJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRkZTYxNjM0MmJjMzk0NzNkZDdjYmY4In0.VrSrFkbY09DRQZa0W4uWa5VFqyXZH37jqXZ8sny1-WE';

Papi.auth(betaJwtToken);

module.exports = Papi;
