import computed from 'ember-addons/ember-computed-decorators';
import { popupAjaxError } from 'discourse/lib/ajax-error';
import Group from 'discourse/models/group';

export default Ember.Controller.extend({

  @computed('model.content')
  checkedContent(content){
    return content;
  },

  @computed('model.hasChanged')
  disableSave(val){
    return !val;
  },

  groupFinder(term) {
    return Group.findAll({ term: term, ignore_automatic: false });
  },

  actions: {
    save(){
      if(this.get('saveDisabled')){return;};
      this.get('model').save().then(() => {
        this.get('model').setInitialValue();
      }).catch(popupAjaxError);
    },

    destroy(){
      this.get('model').destroyRecord().then(() => {
        this.transitionToRoute('adminPlugins.topic-cta');
      }).catch(popupAjaxError);
    },

  }
});