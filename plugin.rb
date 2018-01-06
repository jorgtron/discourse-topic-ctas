# name: discourse-topic-cta
# about: Add custom call-to-action content in between posts
# version: 0.1
# authors: David Taylor
# url: https://github.com/davidtaylorhq/discourse-topic-cta

enabled_site_setting :topic_cta_enabled

register_asset 'stylesheets/topic-cta.scss'
register_asset 'stylesheets/topic-cta-admin.scss'

after_initialize do

  module ::TopicCta
    def self.plugin_name
      'discourse-topic-cta'.freeze
    end

    class Engine < ::Rails::Engine
      engine_name "topic-cta"
      isolate_namespace TopicCta
    end
  end

  User.register_custom_field_type('dismissed_topic_cta', :text)
  DiscoursePluginRegistry.serialized_current_user_fields << "dismissed_topic_cta"

  add_to_serializer(:current_user, :custom_fields, false) {
    if object.custom_fields == nil then
      {}
    else
      object.custom_fields
    end
  }

  add_to_serializer(:topic_view, :ctas, false) {
    rows = TopicCta::CtaDefinition.enabled

    rows = rows.select { |row| row.should_display?(object.topic, scope.user) }

    data = rows.map { |c| { name: c.name,
                            content: c.content,
                            start_at: c.start_at,
                            show_every: c.show_every,
                            show_on_last: c.show_on_last
                        }
    }
    return data
  }

  add_admin_route 'topic_cta.menu_title', 'topic-cta'

  require_dependency 'application_controller'
  class TopicCta::TopicCtaController < ::ApplicationController
    requires_plugin TopicCta.plugin_name

    def index
      render json: {}
    end

    def list_definitions
      all_definitions = ::TopicCta::CtaDefinition.all

      render_serialized all_definitions, TopicCta::BasicCtaDefinitionSerializer, root: 'cta_definitions'
    end

    def definition

      render_serialized ::TopicCta::CtaDefinition.find(params[:id]), TopicCta::CtaDefinitionSerializer
    end

    def update_definition
      begin
        definition = TopicCta::CtaDefinition.find(params[:id].to_i)
        hash = params.require(:cta_definition).permit(:name,
                                                      :enabled,
                                                      :show_on_last,
                                                      :content,
                                                      :show_every,
                                                      :start_at,
                                                      :start_datetime,
                                                      :end_datetime,
                                                      :start_time,
                                                      :end_time,
                                                      :target,
                                                      :target_id,
                                                      :show_to_group_names,
                                                      :hide_from_group_names,
                                                      target_tags: [])

        hash[:enabled] = hash[:enabled] == 'true'
        hash[:show_on_last] = hash[:show_on_last] == 'true'

        if not definition.update(hash)
          raise Discourse::InvalidParameters, definition.errors.full_messages.join(',')
        end

        render_serialized definition, TopicCta::CtaDefinitionSerializer, root: 'cta_definition'
      rescue Discourse::InvalidParameters => e
        render json: { errors: [e.message] }, status: 422
      end
    end

    def destroy_definition
      definition = TopicCta::CtaDefinition.find(params[:id].to_i)
      definition.destroy

      render json: success_json
    end

    def create_definition
      begin
        definition = TopicCta::CtaDefinition.create!

        render_serialized definition, TopicCta::CtaDefinitionSerializer, root: 'cta_definition'
      rescue Discourse::InvalidParameters => e
        render json: { errors: [e.message] }, status: 422
      end
    end

  end

  TopicCta::Engine.routes.draw do
    root to: "topic_cta#index"
    get "cta_definitions", to: "topic_cta#list_definitions"
    get "cta_definitions/:id", to: "topic_cta#definition"
    put "cta_definitions/:id", to: "topic_cta#update_definition"
    delete "cta_definitions/:id", to: "topic_cta#destroy_definition"
    post "cta_definitions/new", to: "topic_cta#create_definition"
    get ":id", to: "topic_cta#index"
  end

  Discourse::Application.routes.append do
    mount ::TopicCta::Engine, at: '/admin/plugins/topic-cta', constraints: AdminConstraint.new
  end

  require_relative "app/models/plugin_model"
  require_relative "app/models/cta_definition"
  require_relative "app/serializers/basic_cta_definition_serializer"
  require_relative "app/serializers/cta_definition_serializer"

end
