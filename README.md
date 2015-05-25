PAPI.js (Pressly API)
==

*** Read this first! ***

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

```javascript
var api = new Papi();
```

## Querying

Before we can fetch data we need to set up the appropriate resource we wish to query.

##### Querying a root resource
```javascript
var resource = api.$resource('hubs'); // returns a Hubs Resource
```

##### Querying a child resource
```javascript
var resource = api.$resource('hubs.assets'); // returns an Assets Resource
```

##### Preparing a query with resource params
```javascript
var resource = api.$resource('hubs.assets', { hubId: 123 }); // returns an Assets Resource with set hub id
```

## Fetching Data

Fetching data is done by the `$all` and `$find` methods on a Resource.

##### $all(`*params`)
- **params** (optional) | Object ex. `{ hubId: 123 }`
params will override anything set in the resource.

Returns a `Promise` which resolves an Array of result models.

```javascript
resource.$all().then(function(hubs) {
  ...
});
```

##### $find(`id` or `params`)
- **id** (optional) | Integer | ex `123`
- **params** (optional) | Object ex. `{ hubId: 123, id: 1 }`
params will override anything set in the resource.

returns a `Promise` which resolves a result model.

```javascript
resource.find(123).then(function(hub) {
  ...
});
```

##### Result models can also `$resource` child resources to get associated data

Result models are extended with the query resource that generated it so you can
access `$resource` to generate child resources.

```javascript
api.$resource('hubs').$find(123).then(function(hub) {
  hub.$resource('apps').$all().then(function(apps) {
    ..
  });
});
```

Notice that when you chain queries you specify the child name `hubs` rather than the full resource key `hubs.apps`.

This is equivalent to:

```javascript
api.$resource('hubs').$find(123).then(function(hub) {
  api.$resource('hubs.apps', { hubId: hub.id }).$all().then(function(apps) {
    ..
  });
});
```
