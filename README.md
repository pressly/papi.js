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

** Querying a root resource **
```javascript
api.$query('hubs'); // returns a Hubs Resource for the  
```

** Querying a child resource **
```javascript
api.$query('hubs.assets'); // returns an Assets Resource
```

** Preparing a resource query **
```javascript
api.$query('hubs.assets', {hubId: 123}); // returns an Assets Resource with set hub id
```

## Fetching Data
Fetching data is done by the `$all` and `$find` methods on a Resource.

##### $all(`*params`)
- **params** (optional) | Object ex. `{ hubId: 123 }`

Returns a `Promise` which resolves an Array of result models.

```javascript
api.$query('hubs').$all().then(function(hubs) {
  ...
});
```

##### $find(`id` or `params`)
- **id** (optional) | Integer | ex `123`
- **params** (optional) | Object ex. `{ hubId: 123, id: 1 }`

returns a `Promise` which resolves a result model.

```javascript
api.$query('hubs').find(123).then(function(hub) {
  ...
});
```
