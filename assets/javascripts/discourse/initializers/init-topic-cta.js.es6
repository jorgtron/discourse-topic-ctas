import { withPluginApi } from 'discourse/lib/plugin-api';
import { h } from 'virtual-dom';
import { observes, on }  from 'ember-addons/ember-computed-decorators';

export default {
  name: 'initialize-topic-cta',
  initialize(container) {

    const siteSettings = container.lookup('site-settings:main');

    if(!siteSettings.topic_cta_enabled){
      return;
    }

    withPluginApi('0.1', api => {

      // Modify the post stream so that posts are given a "visible post number"
      api.modifyClass('model:post-stream', {
        @observes('posts.[]', 'stream')
        triggerUpdateVisibleNumbers(){
          Ember.run.once(this, 'updateVisibleNumbers');
        },

        updateVisibleNumbers(){
          // Add the visible number to each post
          const postArray = this.get('posts');
          for(var post of postArray){
            const vis_post_num = this.progressIndexOfPost(post);
            post.set('last_visible_post', vis_post_num === (postArray.length - 1));
            post.set('visible_post_number', vis_post_num);
          }
        }

      });

      // Extend the post model to include CTA information and methods
      api.includePostAttributes('post_cta');
      api.modifyClass('model:post', {
        @observes('topic')
        setupWatcher(topic){
          if(topic){
            this.appEvents.on('topiccta:changed', () => {
              this.setCtas();
            });
          };
        },

        @observes('topic.ctas', 'visible_post_number')
        setCtas(){
          const ctas = this.get('topic.ctas');

          const visible_post_number = this.get('visible_post_number');
          const is_last_post = this.get('last_visible_post');

          if(visible_post_number !== undefined){

            const currentUser = api.getCurrentUser();
            var possibleCtas = [];

            for (var cta of ctas){
              const showAnyway = is_last_post && cta.show_on_last;

              if(!showAnyway && visible_post_number < cta.start_at){
                continue;
              }
              if(!showAnyway && (visible_post_number - cta.start_at) % cta.show_every !== 0){
                continue;
              }
              const isHidden = currentUser && currentUser.hasDismissedCta(cta.name);
              if(isHidden){
                continue;
              }
              possibleCtas.push(cta);
            }

            if(possibleCtas.length > 0){
              // Pick a random one
              const thisCta = possibleCtas[Math.floor(Math.random() * possibleCtas.length)];
              this.set('post_cta', thisCta);
            }else{
              this.set('post_cta', undefined);
            }
          }
        },

        trackCtaImpression(){
          // Only track once per post
          if(this.get('has_tracked_cta_impression')){ return; }
          this.set('has_tracked_cta_impression', true);
          const cta = this.get('post_cta');

          if (cta && typeof window.ga !== 'undefined') {
            window.ga('send', 'event', 'topic-cta', 'impression', cta.name);
          }
        }
      });

      // When a post comes into view, track a CTA impression
      const appEvents = container.lookup('app-events:main');
      appEvents.on('topic:current-post-changed', (post) => {
        post.post.trackCtaImpression();
      });

      // Create a topic-cta widget, for mounting under posts
      api.createWidget('topic-cta', {
        tagName: 'div.topic-cta-container',

        html(attrs){

          const thisCta = attrs.post_cta;
          if(thisCta){
            var items = [];
            if(this.currentUser){ // Only include dismiss button if logged in
              items.push(this.attach('flat-button', { className: 'dismiss-topic-cta',
                                         icon: 'close',
                                         title: 'topic_cta.dismiss',
                                         action: 'dismissTopicCta' }));
            }

            items.push(h('div.topic-cta', { innerHTML: thisCta.content } ));

            return items;
          }else{
            return;
          }
        },

      });

      // Attach a handler for dismissing the cta
      api.attachWidgetAction('post', 'dismissTopicCta', function() {
        console.log("Dismissing ", this.attrs.post_cta.name);
        this.currentUser.dismissTopicCta(this.attrs.post_cta.name);
        this.appEvents.trigger('topiccta:changed');
        this.appEvents.trigger('post-stream:refresh', {force: true});

        if (typeof window.ga !== 'undefined') {
          window.ga('send', 'event', 'topic-cta', 'dismiss', this.attrs.post_cta.name);
        }
      });

      // Attach widgets below posts and "small actions"
      api.decorateWidget('post:after', (dec) => {
        return dec.attach('topic-cta', {post_cta: dec.attrs.post_cta});
      });

      api.decorateWidget('post-small-action:after', (dec) => {
        return dec.attach('topic-cta', {post_cta: dec.attrs.post_cta});
      });
    });
  }
};
