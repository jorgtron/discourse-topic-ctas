class TopicCta::CtaDefinitionSerializer < ApplicationSerializer
  attributes :id,
             :enabled,
             :show_on_last,
             :name,
             :content,
             :show_every,
             :start_at,
             :start_datetime,
             :end_datetime,
             :start_time,
             :end_time,
             :target,
             :target_id,
             :target_tags,
             :show_to_group_names,
             :hide_from_group_names
end
