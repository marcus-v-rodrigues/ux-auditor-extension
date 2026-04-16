export const HEURISTIC_THRESHOLDS = {
  interaction_patterns: {
    pointer_motion: {
      hover_prolonged: {
        min_duration_ms: 1500,
        max_spread_px: 15,
      },
      visual_search_burst: {
        min_duration_ms: 3000,
        min_move_count: 12,
        max_action_count: 1,
        min_movement_density_per_second: 4,
      },
      erratic_motion: {
        min_duration_ms: 1000,
        min_move_count: 6,
        max_path_efficiency: 0.7,
        min_direction_changes: 4,
        direction_change_angle_radians: Math.PI / 4,
        segment_gap_ms: 700,
        click_burst_gap_ms: 1200,
        rage_click_min_clicks: 3,
      },
    },
    form_interaction: {
      local_hesitation: {
        min_gap_ms: 2500,
      },
      input_revision: {
        min_revision_count: 2,
        max_standalone_tolerance: 0,
      },
    },
    toggle_interaction: {
      repeated_toggle: {
        min_toggle_count: 2,
      },
    },
  },
  session_windows: {
    pointer_segment_gap_ms: 1200,
    pointer_long_pause_ms: 500,
    pointer_movement_gap_ms: 100,
    pointer_movement_distance_px: 12,
    hover_region_gap_ms: 1500,
    rage_click_window_ms: 1200,
  },
  ui_dynamics: {
    mutation_window: {
      max_idle_gap_ms: 1200,
    },
    layout_shift: {
      // Placeholder for future explicit layout-shift thresholds.
    },
    feedback_appearance: {
      // Placeholder for future explicit feedback thresholds.
    },
  },
  heuristic_evidence: {
    accessibility: {
      minimum_interactive_target_size_px: 44,
    },
    usability: {
      structural_burst_node_count: 20,
    },
  },
  aggregation: {
    maxItems: 200,
  },
};
