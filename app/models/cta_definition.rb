class TopicCta::CtaDefinition < TopicCta::PluginModel
  KEY_PREFIX = 'cta_def:'
  default_scope { where("key like?", "#{KEY_PREFIX}%") }

  # Setup ActiveRecord::Store to use the JSON field to read/write these values
  store :value, accessors: [ :enabled, :show_on_last, :name, :content, :show_every, :start_at, :start_datetime, :end_datetime, :start_time, :end_time, :target, :target_id, :target_tags, :show_to_groups, :hide_from_groups  ], coder: JSON

  validates :enabled, inclusion: { in: [true, false] }
  validates :show_on_last, inclusion: { in: [true, false] }
  validates :name, format: { with: /\A[A-Za-z0-9\-_]+\z/ }

  validates :show_every, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :start_at, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  validates :target, inclusion: { in: ['all', 'topic', 'category', 'tag'] }
  validates :target_id, numericality: { only_integer: true, greater_than_or_equal_to: 1 }, unless: -> { target == 'all' }

  validate :datetimes_are_valid

  after_initialize :init_definition
  def init_definition
    default_content = <<END
<div class='example-cta'><p>Enjoying this topic? Why not check out our other great topics? <a href='/top' onclick="ga('send', 'event', 'topic-cta', 'click', 'new_cta')">Top Topics</a></p></div>
END

    self.enabled = false if self.enabled.nil?
    self.name = 'new_cta' if self.name.nil?
    self.content = default_content if self.content.nil?
    self.start_at = 2 if self.start_at.nil?
    self.show_every = 3 if self.show_every.nil?
    self.show_on_last = false if self.show_on_last.nil?
  end

  scope :enabled, ->() { where("value::json->>'enabled'='true'") }

  def start_datetime=(datetime)
    if datetime.blank? || datetime.nil?
      super(nil)
    else
      super(datetime)
    end
  end

  def end_datetime=(datetime)
    if datetime.blank? || datetime.nil?
      super(nil)
    else
      super(datetime)
    end
  end

  def start_time=(time)
    if time.blank? || time.nil?
      super(nil)
    else
      super(time)
    end
  end

  def end_time=(time)
    if time.blank? || time.nil?
      super(nil)
    else
      super(time)
    end
  end

  def show_to_group_names=(names)
    array = names.split(",")
    self.show_to_groups = Group.where(name: array).pluck(:id)
  end

  def show_to_group_names
    Group.where(id: self.show_to_groups).pluck(:name).join(',')
  end

  def hide_from_group_names=(names)
    array = names.split(",")
    self.hide_from_groups = Group.where(name: array).pluck(:id)
  end

  def hide_from_group_names
    Group.where(id: self.hide_from_groups).pluck(:name).join(',')
  end

  def datetimes_are_valid
    if self.start_datetime
      errors.add(:start_datetime, 'must be a valid datetime') if ((DateTime.parse(self.start_datetime) rescue ArgumentError) == ArgumentError)
    end
    if self.end_datetime
      errors.add(:end_datetime, 'must be a valid datetime') if ((DateTime.parse(self.end_datetime) rescue ArgumentError) == ArgumentError)
    end
  end

  def should_display?(topic, user)
    now = DateTime.now

    should_display = true

    # Start datetime
    if self.start_datetime
      start_time = DateTime.parse(self.start_datetime)
      if now < start_time
        should_display = false
      end
    end

    # End datetime
    if self.end_datetime
      end_time = DateTime.parse(self.end_datetime)
      if now > end_time
        should_display = false
      end
    end

    # Restrict time of day
    if self.start_time || self.end_time
      start_time = self.start_time ? DateTime.parse(self.start_time) : DateTime.now.start_of_day
      end_time = self.end_time ? DateTime.parse(self.end_time) : DateTime.now.end_of_day

      if end_time < start_time # End time after start time
        end_time = end_time.next_day
      end
      should_display = false if !(now > start_time && now < end_time)
    end

    # End time

    # Check target matches
    if self.target == 'topic'
      should_display = false if topic.id != self.target_id.to_i
    elsif self.target == 'category'
      should_display = false if topic.category_id != self.target_id.to_i
    elsif self.target == 'tag'
      matching_tags = topic.tags.pluck(:name) & self.target_tags
      should_display = false if matching_tags.empty?
    end

    # Check user groups
    if user
      if self.show_to_groups && !self.show_to_groups.empty? # If show to groups is set
        intersection = self.show_to_groups & user.group_ids
        if intersection.empty? # If there's no intersection
          should_display = false
        end
      end

      if self.hide_from_groups && !self.hide_from_groups.empty? # If hide from groups is set
        intersection = self.hide_from_groups & user.group_ids
        if !intersection.empty? # If there is an intersection
          should_display = false
        end
      end
    else

      if self.show_to_groups && !self.show_to_groups.empty? # If show to groups is set
        should_display = false
      end

    end

    return should_display
  end

end
