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

## Resources

Before we can fetch data we need to set up the appropriate resource we wish to query.

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
In cases where we are creating a nested resource we will need to specify the ids of the parents. This can be done at the time you request data from the resource via the `$all` or `$find` methods *or* you can prepare the resource with default params when you create it.

**Note** The param names for parent ids take the form `{singular parent name }Id` ie. hubs -> hubId

```javascript
var resource = api.$resource('hubs.assets', { hubId: 123 }); // returns an Assets Resource with set hub id
```

Now this resource will be setup to return assets from hub '123'.

Here is an example of preparing a resource that is nested 3 deep. The styles resource.

```javascript
var resource = api.$resource('hubs.apps.styles', { hubId: 123, appId: 456 }); // returns a Styles Resource with set hub and app id
```

## Requests

Requesting data is done by the `$all` and `$find` methods on a Resource.

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
resource.$find(123).then(function(hub) {
  ...
});
```

##### Models can also `$resource` child resources to get associated data

Result models are extended with the resource that generated it so you can
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
