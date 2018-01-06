export default Discourse.Route.extend({
  model() {
    return this.store.findAll('cta-definition');
  },

  actions: {
    willTransition(transition) {
      if(transition.intent.name === 'adminPlugins.topic-cta'){
        this.refresh();
      }
    },
    reload(){
      this.refresh();
    }

	}
});
