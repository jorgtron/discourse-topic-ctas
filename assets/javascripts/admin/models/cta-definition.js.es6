import { on, observes } from 'ember-addons/ember-computed-decorators';
import computed from 'ember-addons/ember-computed-decorators';
import RestModel from 'discourse/models/rest';

export default RestModel.extend({

  available_targets: [
    { id: 'all', name: I18n.t('topic_cta.target.all')},
    { id: 'topic', name: I18n.t('topic_cta.target.topic')},
    { id: 'category', name: I18n.t('topic_cta.target.category')},
    { id: 'tag', name: I18n.t('topic_cta.target.tag')}
  ],

  @on('init')
  setInitialValue(){
    this.set('initial', this.updateProperties());
  },

  @computed('initial', 'name','enabled','show_on_last','content','show_every','start_at', 'start_datetime', 'end_datetime', 'start_time', 'end_time', 'target', 'target_id', 'target_tags', 'show_to_group_names', 'hide_from_group_names')
  hasChanged(){
    return JSON.stringify(this.updateProperties()) !== JSON.stringify(this.get('initial'));
  },

  @computed('target')
  isTargetTopic(target){
    return target === 'topic';
  },

  @computed('target')
  isTargetCategory(target){
    return target === 'category';
  },

  @computed('target')
  isTargetTag(target){
    return target === 'tag';
  },

  updateProperties() {
    var prop_names = ['name', 'enabled', 'show_on_last', 'content', 'show_every', 'start_at', 'start_datetime', 'end_datetime', 'start_time', 'end_time', 'target', 'target_id', 'target_tags', 'show_to_group_names', 'hide_from_group_names'];
    return this.getProperties(prop_names);
  },

  createProperties() {
    return this.updateProperties();
  },

});
