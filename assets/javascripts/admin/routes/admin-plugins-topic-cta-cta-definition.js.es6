import { popupAjaxError } from 'discourse/lib/ajax-error';

export default Discourse.Route.extend({
  model(params) {
    return this.store.find('cta-definition', params.id);
  },
  afterModel(model){
    model.setInitialValue();
  },
  actions: {
    refresh: function(){
      this.refresh();
    },

    save(){
      if(this.get('saveDisabled')){return;};
      this.get('model').save().then(() => {
        this.get('model').setInitialValue();
      }).catch(popupAjaxError);
    },

    destroy(){
      this.get('model').destroyRecord().then(() => {
        this.transitionTo('adminPlugins.topic-cta');
      }).catch(popupAjaxError);
    }
	}
});
