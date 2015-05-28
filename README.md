PAPI.js (Pressly API)
==

*** Read this first! ***

## Install

You can install through npm and require in your project with commonJS require.

##### npm
```
npm install papi
```

```javascript
var Papi = require('papi');
```

##### Download Release

Releases can be downloaded here https://github.com/pressly/papi.js/releases you can then script include /dist/papi.js in your project

```html
<script type="text/javascript" src="papi.js"></script>
```

This will expose the `Papi` class globally.

## API Schema

* accounts
    * users
    * hubs
* hubs
    * assets
    * apps
        * styles
    * collections
    * tags
    * users
    * invites
    * recommendations
    * feeds
      * assets
    * drafts
* code_revisions
  * hubs

## Connection

##### Papi::constructor(`*host`, `*jwt`)
- **host** (optional) | String | defaults to 'https://beta-api.pressly.com'
- **jwt*** (optional) | String | a JSON Web Token

```javascript
var api = new Papi();
```

## Authentication

All authentication is handled under the Papi.auth module.

##### auth.login(`email`, `password`)
- **email** (required) | String
- **password*** (required) | String

Returns Promise which resolves session response.

```javascript
api.auth.login(email, password).then(function(session) {
  // Returns logged in session
});
```

##### auth.logout()

Returns promise for successful logout.

```javascript
api.auth.logout(email, password).then(function() {
  // User is successfully logged out
});
```

##### auth.get()

Returns promise which resolves the current session.

This will attempt to pass an authentication cookie if one exists to retreive the logged in session.

```javascript
api.auth.get().then(function(session) {
  // Returns current session if already logged in
});
```

##### auth.set(`session`)
- **session** (required) | Object | a stored session object.

You may wish to store the `api.auth.session` object on the client and restore it at a later time.

```javascript
api.auth.set(session);
```

## Resources

Before we can fetch data we need to set up the appropriate resource we wish to query.

##### $resource(`key`, `*params`)
- **key** (required) | String | Key of the resource eg. 'hubs.assets'
- **params** (optional) | Object | eg. {hubId: 123}

Returns a prepared Resource.

##### Creating a resource
```javascript
var resource = api.$resource('hubs'); // returns a Hubs Resource
```

##### Creating a nested resource
When directly specifying nested resources we use the format `parent.child` starting from the root.

```javascript
var resource = api.$resource('hubs.assets'); // returns an Assets Resource
```

##### Preparing a resource with params
In cases where we are creating a nested resource we will need to specify the ids of the parents. This can be done at the time you request data from the resource via the `all` or `find` methods *or* you can prepare the resource with default params when you create it.

**Note** The param names for parent ids take the form `{singular parent name }Id` ie. hubs -> hubId

```javascript
var resource = api.$resource('hubs.assets', { hubId: 123 }); // returns an Assets Resource with set hub id
```

Now this resource will be setup to return assets from hub '123'.

Here is an example of preparing a resource that is nested 3 deep. The styles resource.

```javascript
var resource = api.$resource('hubs.apps.styles', { hubId: 123, appId: 456 }); // returns a Styles Resource with set hub and app id
```

#### Additional Modifiers

You can additionally set modifiers on the resource like limiting the number of results, or setting query params.

##### limit(`rpp`)
- **rpp** (required) | Integer | Requests per page, Number or results to return for `all` and custom actions

Returns the resource.

```javascript
resource.limit(15);
```

##### query(`params`)
- **params** (required) | Object | Query params that will be set on the request ie. `{q:1, b: 2}` -> `?q=1&b=2`

Returns the resource.

```javascript
resource.query({q: 1, b: 2});
```

Because modifiers return the current resource you can chain them like so:

```javascript
resource.limit(15).query({q: 1, b: 2});
```

## Requests

Requesting data is done by the `all` and `find` methods on a Resource.

##### all(`*params`)
- **params** (optional) | Object | ex. `{ hubId: 123 }`
params will override anything set in the resource.

Returns a `Promise` which resolves an Array of result models.

```javascript
resource.all().then(function(hubs) {
  ...
});
```

##### find(`id` or `params`)
- **id** (optional) | Integer | ex `123`
- **params** (optional) | Object | ex. `{ hubId: 123, id: 1 }`
params will override anything set in the resource.

returns a `Promise` which resolves a result model.

```javascript
resource.find(123).then(function(hub) {
  ...
});
```

##### Models can also `$resource` child resources to get associated data

Result models are extended with the resource that generated it so you can
access `$resource` to generate child resources.

```javascript
api.$resource('hubs').find(123).then(function(hub) {
  hub.$resource('apps').all().then(function(apps) {
    ..
  });
});
```

Notice that when you chain queries you specify the child name `hubs` rather than the full resource key `hubs.apps`.

This is equivalent to:

```javascript
api.$resource('hubs').find(123).then(function(hub) {
  api.$resource('hubs.apps', { hubId: hub.id }).all().then(function(apps) {
    ..
  });
});
```
