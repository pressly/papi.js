import Papi from 'papi';
import React from 'react';
import Reflux from 'reflux';
import moment from 'moment';

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
    ewidth: '100%',
  };

  this.settings = {
    items:  options.items  || this.defaults.items,
    width:  options.width  || this.defaults.width,
    height: options.height || this.defaults.height,
    ewidth: options.ewidth || this.defaults.ewidth,
  };
};

/**
 * Initialize the Embed.
 */
PresslyEmbed.prototype.init = function() {
  var self = this;

  // update container width
  $(this.container).css('width', this.settings.ewidth);

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
  self.refitAssets();
  $(window).on('resize', debounce(function() { self.refitAssets(); }, 200));
};

/**
 * Refit assets to screen.
 */
PresslyEmbed.prototype.refitAssets = function() {
  var containerRatio = Math.floor($(this.container).width() / this.settings.height);

  if (this.settings.items >= containerRatio) {
    this.$embed.data('owlCarousel').options.items  = containerRatio;
    this.$embed.data('owlCarousel').settings.items = containerRatio;
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


// query params
var queryParams = (function(qs) {
  qs = qs.split("+").join(" ");

  var params = {}
    , tokens
    , re = /[?&]?([^=]+)=([^&]*)/g;

  while (tokens = re.exec(qs)) {
    params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  }

  return params;
})(document.location.search);

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

// initialize new Embed instance
var presslyEmbed = new PresslyEmbed(queryParams);


/**
 * React stuff.
 */
var embedActions = Reflux.createActions([ 'loadAssets', 'loadAssetsSuccess', 'loadAssetsError' ]);
var embedStore = Reflux.createStore({
  init: function() {
    this.assets = [];
    this.listenTo(embedActions.loadAssets, this.loadAssets);
    this.listenTo(embedActions.loadAssetsError, this.loadAssetsError);
    this.listenTo(embedActions.loadAssetsSuccess, this.loadAssetsSuccess);
  },

  // Load Embed assets
  loadAssets: function(provider, q) {
    this.trigger({ loading: true });

    Papi.loadHubs().end(function(res) {
      var hubId = res.body[0].id;

      Papi.loadAssets(hubId).end(function(assets) {
        embedActions.loadAssetsSuccess(assets.body);
        console.log(assets.body);
      });
    });
  },

  loadAssetsSuccess: function(assets) {
    this.assets = assets;

    this.trigger({
      assets : this.assets,
      loading: false
    });

    presslyEmbed.init();
  },

  loadAssetsError: function(error) {
    this.trigger({
      error : error,
      loading: false
    });
  }
});

var PresslyEmbedComponent = React.createClass({
  getInitialState: function() {
    return {
      assets : [],
      loading : false,
      error : false,
    }
  },

  componentDidMount: function() {
    this.unsubscribe = embedStore.listen(this.onStatusChange);
    embedActions.loadAssets();
  },

  componentWillUnmount: function() {
    this.unsubscribe();
  },

  onStatusChange: function(state) {
    this.setState(state);
  },

  render: function() {
    var loading = this.state.loading ? <div>Loading...</div> : '';
    var assets = [];

    if (this.state.assets.length) {
      assets = this.state.assets.map(function(item, index) {
        var d       = new Date(item.created_at)
          , width   = presslyEmbed.settings.width
          , height  = presslyEmbed.settings.height
          , timeAgo = moment(d).fromNow(true) + ' ago';

        var imageStyle = {
          backgroundImage: 'url(' + Papi.imgry(item.title_image.url, width, height) + ')',
          backgroundSize: 'cover',
          height: height
        };

        return (
          <li key={ item.id }>
            <div className="asset-contents">
              <div className="image" style={ imageStyle } />
              <div className="content">
                <div className="byline">{ item.author.name ? item.author.name + ' - ' : '' }{ timeAgo }</div>
                <h1 className="title"><a href={ item.source.url } target="_blank" dangerouslySetInnerHTML={{ __html: item.title }}></a></h1>
              </div>
            </div>
            <a href={ item.source.url } className="link" target="_blank"></a>
          </li>
        );
      });
    }

    return (
      <div className="pressly-embed-container">
        <ul className="pressly-embed owl-carousel">{ assets }</ul>
      </div>
    );
  }
});

React.render(<PresslyEmbedComponent />, document.body);
