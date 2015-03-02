import Papi from 'papi';
import Reflux from 'reflux';
import assetActions from '../actions/assetActions';

var assetStore = Reflux.createStore({

  init: function() {
    this.assets = [];

    this.listenTo(assetActions.loadAssets, this.loadAssets);
    this.listenTo(assetActions.loadAssetsError, this.loadAssetsError);
    this.listenTo(assetActions.loadAssetsSuccess, this.loadAssetsSuccess);
  },

  loadAssets: function(provider, q) {
    this.trigger({ loading: true });

    // PAPI search
    Papi.search(provider, q).end(function(res) {
      assetActions.loadAssetsSuccess(res.body);
    });
  },

  loadAssetsSuccess: function(assets) {
    this.assets = assets;

    this.trigger({
      assets : this.assets,
      loading: false
    });
  },

  loadAssetsError: function(error) {
    this.trigger({
      error : error,
      loading: false
    });
  }

});

module.exports = assetStore;
