import Papi from 'papi';
import React from 'react';
import embedStore from '../stores/embedStore';
import embedActions from '../actions/embedActions';

var PresslyEmbed = React.createClass({

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
        var d         = new Date(item.created_at)
          , moment    = d.getDay() + '/' + d.getMonth() + '/' + d.getFullYear()
          , imgWidth  = 400
          , imgHeight = 250;

        var bgStyle = {
          backgroundImage: 'url(' + Papi.imgry(item.title_image.url, imgWidth, imgHeight) + ')',
          backgroundSize: 'cover',
          height: imgHeight
        };

        return (
          <li key={ item.id }>
            <div className="asset-contents">
              <div className="image" style={ bgStyle } />
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
      <ul className="embed-results owl-carousel">{ assets }</ul>
    );
  }

});

module.exports = PresslyEmbed;
