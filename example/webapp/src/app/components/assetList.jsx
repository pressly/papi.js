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
    this.setState({ query: e.target.value });
  },

  handleSubmit: function(e) {
    e.preventDefault();
    assetActions.loadAssets(this.state.query);
  },

  render: function() {
    var loading = this.state.loading ? <div>Loading...</div> : '';
    var assets = this.state.assets;

    // Regular search (multiple results)
    if (assets.length) {
      assets = this.state.assets.map(function(asset, index) {
        return <li key={ asset.id }><img className="avatar" src={ asset.author.avatar_url } /> - { asset.author.name } - { asset.source.url }</li>
      });

    // @username search (single result)
    } else {
      assets = <li key={ assets.uid }><img src={ assets.avatar_url } /> { assets.name }</li>
    }

    return (
      <div>
        <form onSubmit={this.handleSubmit}>
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
