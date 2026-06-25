var simplemaps_continentmap_mapdata = {
  main_settings: {
    width: "responsive",
    background_color: "#FFFFFF",
    background_transparent: "yes",
    popups: "detect",

    state_description: "",
    state_color: "#88A4BC",
    state_hover_color: "#3B729F",
    state_url: "", //
    border_size: 1.5,
    border_color: "#ffffff",
    all_states_inactive: "no",
    all_states_zoomable: "no",

    location_description: "Location description",
    location_color: "#FF0067",
    location_opacity: 0.8,
    location_hover_opacity: 1,
    location_url: "",
    location_size: 25,
    location_type: "square",
    location_border_color: "#FFFFFF",
    location_border: 2,
    location_hover_border: 2.5,
    all_locations_inactive: "no",
    all_locations_hidden: "no",

    label_color: "#ffffff",
    label_hover_color: "#ffffff",
    label_size: 22,
    label_font: "Arial",
    hide_labels: "no",

    manual_zoom: "no",
    back_image: "no",
    arrow_box: "no",
    navigation_size: "40",
    navigation_color: "#f7f7f7",
    navigation_border_color: "#636363",
    initial_back: "no",
    initial_zoom: -1,
    initial_zoom_solo: "no",
    region_opacity: 1,
    region_hover_opacity: 0.6,
    zoom_out_incrementally: "yes",
    zoom_percentage: 0.99,
    zoom_time: 0.5,

    popup_color: "white",
    popup_opacity: 0.9,
    popup_shadow: 1,
    popup_corners: 5,
    popup_font: "12px/1.5 Verdana, Arial, Helvetica, sans-serif",
    popup_nocss: "no",

    div: "map",
    auto_load: "yes",
    rotate: "0",
    url_new_tab: "no",
    images_directory: "default",
    import_labels: "no",
    fade_time: 0.1,
    link_text: "View Website",
  },

  state_specific: {
    SA: {
      name: "South America",
      url: "javascript:window.dispatchEvent(new CustomEvent('continent-selected',{detail:'South America'}));",
    },
    NA: {
      name: "North America",
      url: "javascript:window.dispatchEvent(new CustomEvent('continent-selected',{detail:'North America'}));",
    },
    EU: {
      name: "Europe",
      url: "javascript:window.dispatchEvent(new CustomEvent('continent-selected',{detail:'Europe'}));",
    },
    AF: {
      name: "Africa",
      url: "javascript:window.dispatchEvent(new CustomEvent('continent-selected',{detail:'Africa'}));",
    },
    NS: {
      name: "North Asia",
      url: "javascript:window.dispatchEvent(new CustomEvent('continent-selected',{detail:'Asia'}));",
    },
    SS: {
      name: "South Asia",
      url: "javascript:window.dispatchEvent(new CustomEvent('continent-selected',{detail:'Asia'}));",
    },
    ME: {
      name: "Middle East",
      url: "javascript:window.dispatchEvent(new CustomEvent('continent-selected',{detail:'Asia'}));",
    },
    OC: {
      name: "Oceania",
      url: "javascript:window.dispatchEvent(new CustomEvent('continent-selected',{detail:'Australia'}));",
    },
  },

  locations: {},
  labels: {},
};
