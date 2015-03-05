import Papi from 'papi';

/**
 * Pressly Embed.
 */
function PresslyEmbed(options) {
  this.$embed = null;
  this.container = '.pressly-embed-container';

  this.defaults = {
    items: 5,
    width: 250,
    height: 200,
    ewidth: 0,
  };

  this.settings = $.extend(this.defaults, options);

  // Papi auth
  Papi.auth(this.settings.jwt);
};

/**
 * Initialize the Embed.
 */
PresslyEmbed.prototype.init = function() {
  var self = this;

  // update container width
  if (this.settings.ewidth > 0) {
    $(this.container).css('width', this.settings.ewidth);
  }

  // build carousel
  this.$embed = $('.pressly-embed').owlCarousel({
    items: self.settings.items,
    loop: true,
    dots: false,
    nav: true,
    navText: [ '<', '>' ],
    margin: 10,
    autoplay: true,
    lazyLoad: true,
    autoplaySpeed: 500,
    autoplayTimeout: 2000,
    autoplayHoverPause: true,
    itemElement: 'div',
    //responsive: self.calcResPoints()
  });

  // re-fit assets into container
  self.updateAssets();

  // handle window resize
  $(window).on('resize', debounce(function(e) {
    self.updateContainer();
    self.updateAssets();
  }, 200));
};

/**
 * Recalculate container width.
 */
PresslyEmbed.prototype.updateContainer = function() {
  var width = $(window).width()

  if (width < this.settings.ewidth) {
    $(this.container).css('width', width);
  } else {
    if ($(this.container).width() < this.settings.ewidth) {
      $(this.container).css('width', this.settings.ewidth);
    }
  }
};

/**
 * Refit assets to screen.
 */
PresslyEmbed.prototype.updateAssets = function() {
  var containerRatio = Math.floor($(this.container).width() / this.settings.height);

  if (this.settings.items >= containerRatio) {
    this.$embed.data('owlCarousel').options.items  = containerRatio;
    this.$embed.data('owlCarousel').settings.items = containerRatio;
    this.$embed.data('owlCarousel').refresh();
  } else {
    this.$embed.data('owlCarousel').options.items  = this.settings.items;
    this.$embed.data('owlCarousel').settings.items = this.settings.items;
    this.$embed.data('owlCarousel').refresh();
  }
};

/**
 * Calculate responsive points (wip).
 */
PresslyEmbed.prototype.calcResPoints = function() {
  var containerRatio = Math.floor($(this.container).width() / this.settings.height);

  var items = {
    '1000': this.settings.items <= (containerRatio)     ? this.settings.items : containerRatio,
    '800' : this.settings.items <= (containerRatio - 1) ? this.settings.items : containerRatio - 1,
    '600' : this.settings.items <= (containerRatio - 2) ? this.settings.items : containerRatio - 2,
    '400' : this.settings.items <= (containerRatio - 3) ? this.settings.items : containerRatio - 3,
    '0'   : 1,
  };

  return {
    1000: { items: items['1000'] > 1 ? items['1000'] : 1 },
    800:  { items: items['800']  > 1 ? items['800']  : 1 },
    600:  { items: items['600']  > 1 ? items['600']  : 1 },
    400:  { items: items['400']  > 1 ? items['400']  : 1 },
    0:    { items: items['0'] },
  };
};

// debounce
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    clearTimeout(timeout);

    timeout = setTimeout(function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    }, wait);

    if (immediate && !timeout) func.apply(context, args);
   };
};

module.exports = PresslyEmbed;
