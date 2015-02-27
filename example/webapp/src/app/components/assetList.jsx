import React from 'react';
import assetStore from '../stores/assetStore';
import assetActions from '../actions/assetActions';

var assetList = React.createClass({

  getInitialState: function() {
    return {
      assets : [],
      query: '',
      loading : false,
      error : false,
      provider: 'twitter',
      providers: [ 'twitter', 'gplus', 'youtube' ]
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

  providerSelected: function(e) {
    this.setState({ provider: e.target.value });
  },

  handleSubmit: function(e) {
    e.preventDefault();
    this.state.assets = [];
    assetActions.loadAssets(this.state.provider, this.state.query);
  },

  render: function() {
    var loading = this.state.loading ? <div>Loading...</div> : '';
    var assets = this.state.assets;
    var providers = this.state.providers;
    var self = this;

    var providerList = providers.map(function(provider, index) {
      return (
        <input key={ provider + index } onChange={ self.providerSelected } type="radio" name="provider" value={ provider } checked={ self.state.provider == provider }>{ provider }</input>
      );
    });

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
          { providerList }
          <br />
          <input onChange={this.onInputChange} type="text" value={this.state.query} />
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
