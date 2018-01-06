export default {
  resource: 'admin.adminPlugins',
  path: '/plugins',
  map() {
    this.route('topic-cta', function(){
      this.route('cta-definition', {path: '/:id'});
    });
  }
};