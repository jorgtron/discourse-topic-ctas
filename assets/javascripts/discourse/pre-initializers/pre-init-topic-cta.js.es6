import User from 'discourse/models/user';
import { ajax } from 'discourse/lib/ajax';
import { userPath } from 'discourse/lib/url';
import { default as computed, observes, on }  from 'ember-addons/ember-computed-decorators';

export default {
  name: 'initialize-topic-cta',
  before: 'inject-discourse-objects',
  initialize() {

    User.reopen({
        @computed('custom_fields.dismissed_topic_cta')
        dismissedCtas(dismissedString){
          if(dismissedString){
            return dismissedString.split(',');
          }else{
            return [];
          }
        },

        hasDismissedCta(ctaKey){
          return this.get('dismissedCtas').includes(ctaKey);
        },

        dismissTopicCta(ctaKey) {
          var newDismissedCtas = this.get('dismissedCtas');
          newDismissedCtas.push(ctaKey);
          this.set("custom_fields.dismissed_topic_cta", newDismissedCtas.join(','));
          ajax(userPath(this.get('username')), {
            type: 'PUT',
            data: { custom_fields: { dismissed_topic_cta: newDismissedCtas.join(',') } }
          });
        },
      });
  }
};
