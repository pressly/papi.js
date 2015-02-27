import React from 'react';
import assetStore from '../stores/assetStore';
import assetActions from '../actions/assetActions';

var assetList = React.createClass({

  getInitialState: function() {
    return {
      assets : [],
      query: '',
      loading : false,
      error : false
    }
  },

  componentDidMount: function() {
    this.unsubscribe = assetStore.listen(this.onStatusChange);
  },

  componentWillUnmount: function() {
    this.unsubscribe();
  },

  onStatusChange: function(state) {
    this.setState(state);
  },

  onInputChange: function(e) {
    var input = e.target.value;
    if (!input.length) this.state.assets = [];

    this.setState({ query: input });
  },

  handleSubmit: function(e) {
    e.preventDefault();
    this.state.assets = [];
    assetActions.loadAssets(this.state.query);
  },

  render: function() {
    var loading = this.state.loading ? <div>Loading...</div> : '';
    var assets = this.state.assets;

    // Regular search (multiple results)
    if (assets.length) {
      assets = this.state.assets.map(function(asset, index) {
        return <li key={ asset.id }><img className="avatar" src={ asset.author.avatar_url } /> - { asset.author.name } - <a href={ asset.source.url } target="_blank">{ asset.source.url }</a></li>
      });

    // @username search (single result)
    } else {
      if (assets.uid) {
        assets = <li key={ assets.uid }><img className="avatar" src={ assets.avatar_url } /> { assets.name }</li>
      }
    }

    return (
      <div>
        <form className="searchForm" onSubmit={this.handleSubmit}>
          <input onChange={this.onInputChange} value={this.state.query} />
          <button>Search</button>
        </form>

        { loading }
        <ul className="results">
          { assets }
        </ul>
      </div>
    );
  }

});

module.exports = assetList;
