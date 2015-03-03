import Papi from 'papi';
import React from 'react';
import Reflux from 'reflux';

/**
 * Pressly Embed.
 */
function PresslyEmbed(options) {
  this.defaults = {
    items: 4,
    width: 400,
    height: 250,
  };

  this.settings = {
    items:  options.items  || this.defaults.items,
    width:  options.width  || this.defaults.width,
    height: options.height || this.defaults.height,
  };
};

/**
 * Initialize the Embed.
 */
PresslyEmbed.prototype.init = function() {
  var self = this;

  $('.owl-carousel').owlCarousel({
    items: 1,
    loop: true,
    dots: false,
    nav: true,
    navText: [ '<', '>' ],
    margin: 10,
    autoplay: true,
    stagePadding: 10,
    lazyLoad: true,
    autoplaySpeed: 500,
    autoplayTimeout: 2000,
    autoplayHoverPause: true,
    itemElement: 'div',
    responsive: {
      500:  { items: self.settings.items - 3 || 1 },
      700:  { items: self.settings.items - 2 || 1 },
      900:  { items: self.settings.items - 1 },
      1300: { items: self.settings.items },
    }
  });
}

// get query params
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
          , moment  = d.getDay() + '/' + d.getMonth() + '/' + d.getFullYear();

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
                <div className="byline">{ item.author.name ? item.author.name + ' - ' : '' }{ moment }</div>
                <h1 className="title"><a href={ item.source.url } target="_blank" dangerouslySetInnerHTML={{ __html: item.title }}></a></h1>
              </div>
            </div>
            <a href={ item.source.url } className="link" target="_blank"></a>
          </li>
        );
      });
    }

    return (
      <ul className="pressly-embed owl-carousel">{ assets }</ul>
    );
  }
});

React.render(<PresslyEmbedComponent />, document.body);
