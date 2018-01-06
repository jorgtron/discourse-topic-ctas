import { ajax } from 'discourse/lib/ajax';
import { popupAjaxError } from 'discourse/lib/ajax-error';

export default Ember.Controller.extend({
  actions:{
    create(){
      ajax('/admin/plugins/topic-cta/cta_definitions/new', {
        type: 'POST'
      }).then(data => {
        this.transitionToRoute('adminPlugins.topic-cta.cta-definition', data['cta_definition']['id']);
        this.send('reload');
      }).catch(popupAjaxError);
    }
  }
});