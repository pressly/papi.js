import Papi from 'papi';
import React from 'react';
import Reflux from 'reflux';
import moment from 'moment';
import PresslyEmbed from './embed';

// query params
var queryParams = (function(qs) {
  var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;
  qs = qs.split("+").join(" ");

  while (tokens = re.exec(qs)) {
    params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  }

  return params;
})(document.location.search);

// initialize new Embed instance
var pEmbed = new PresslyEmbed(queryParams);

/**
 * React stuff.
 */
var EmbedActions = Reflux.createActions([ 'loadAssets', 'loadAssetsSuccess', 'loadAssetsError' ]);
var EmbedStore = Reflux.createStore({
  init: function() {
    this.assets = [];
    this.listenTo(EmbedActions.loadAssets, this.loadAssets);
    this.listenTo(EmbedActions.loadAssetsError, this.loadAssetsError);
    this.listenTo(EmbedActions.loadAssetsSuccess, this.loadAssetsSuccess);
  },

  // Load Embed assets
  loadAssets: function(provider, q) {
    Papi.loadHubs().end(function(res) {
      var hubId = res.body[0].id;

      Papi.loadAssets(hubId).end(function(assets) {
        EmbedActions.loadAssetsSuccess(assets.body);
      });
    });
  },

  loadAssetsSuccess: function(assets) {
    this.assets = assets;

    this.trigger({
      assets : this.assets,
    });

    pEmbed.init();
  }
});
var EmbedComponent= React.createClass({
  getInitialState: function() {
    return {
      assets : [],
    }
  },

  componentDidMount: function() {
    this.unsubscribe = EmbedStore.listen(this.onStatusChange);
    EmbedActions.loadAssets();
  },

  componentWillUnmount: function() {
    this.unsubscribe();
  },

  onStatusChange: function(state) {
    this.setState(state);
  },

  render: function() {
    var assets = [];

    if (this.state.assets.length) {
      assets = this.state.assets.map(function(item, index) {
        var d       = new Date(item.created_at)
          , width   = pEmbed.settings.width
          , height  = pEmbed.settings.height
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

React.render(<EmbedComponent />, document.body);
