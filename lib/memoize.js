/**

  Custom memoize function that supports 2 cache expiry modes
  - global cache expiry: Entire cache expires after a set time.
  - individual cache expiry: multiple timeouts are created for each individual hash key is destroyed.

  options:
    maxAge: (in ms)
    individualExpiry: true|false

  example:
    fn = memoize(function(a, b) {...}, {maxAge: 2000, individualExpiry: true});
    fn(1, 2);
    fn(1, 2); // Cache hit!
    fn(2, 3);
    fn(2, 3); // Cache hit!

    setTimeout(function() {
      fn(1, 2); // NO cache hit!
    }, 3000);
  })

  http://jsperf.com/comparison-of-memoization-implementations/
  by @addyosmani, @philogb, @mathias
  with a few useful tweaks from @DmitryBaranovsk

  Modified by @corban: Added expiry options

**/

module.exports = function (fn, options) {
  options || (options = {});

  var globalExpiryTimeout = null;
  var globalExpiryFn = function() {
    fn.memoize = {};
    globalExpiryTimeout = null;
  }

  var useGlobalExpiry = typeof options.maxAge === 'number' && !options.individualExpiry;
  var useIndividualExpiry = typeof options.maxAge === 'number' && options.individualExpiry;

  return function () {
    var args = Array.prototype.slice.call(arguments);
    var hash = "$";
    var i = args.length;
    var currentArg = null;

    while (i--) {
      currentArg = args[i];
      hash += (currentArg === Object(currentArg)) ? JSON.stringify(currentArg) : currentArg;
      fn.memoize || (fn.memoize = {});
    }

    if (hash in fn.memoize) {
      return fn.memoize[hash];
    } else {
      if (useGlobalExpiry && !globalExpiryTimeout) {
        // Starts the global cache expiry timeout if there is no current timeout scheduled
        globalExpiryTimeout = setTimeout(globalExpiryFn, options.maxAge);
      } else if (useIndividualExpiry) {
        // Starts the individual cache expiry timeout if this is the first time we are running this hash
        setTimeout(function() { delete fn.memoize[hash]; }, options.maxAge);
      }

      return fn.memoize[hash] = fn.apply(this, args);
    }
  };
}
