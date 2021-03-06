import { zipObject } from 'lodash';

const ACTION_TYPES = [
  'ADD_QUERY_FILTER',
  'BLUR_SEARCH',
  'CACHE_ZOOM_STATE',
  'CHANGE_INSTANCE',
  'CHANGE_TOPOLOGY_OPTION',
  'CLEAR_CONTROL_ERROR',
  'CLICK_BACKGROUND',
  'CLICK_CLOSE_DETAILS',
  'CLICK_CLOSE_TERMINAL',
  'CLICK_FORCE_RELAYOUT',
  'CLICK_NODE',
  'CLICK_RELATIVE',
  'CLICK_SHOW_TOPOLOGY_FOR_NODE',
  'CLICK_TERMINAL',
  'CLICK_TOPOLOGY',
  'CLOSE_WEBSOCKET',
  'DEBUG_TOOLBAR_INTERFERING',
  'DESELECT_NODE',
  'DO_CONTROL_ERROR',
  'DO_CONTROL_SUCCESS',
  'DO_CONTROL',
  'DO_SEARCH',
  'ENTER_EDGE',
  'ENTER_NODE',
  'FINISH_TIME_TRAVEL_TRANSITION',
  'FOCUS_SEARCH',
  'HIDE_HELP',
  'HOVER_METRIC',
  'JUMP_TO_TIME',
  'LEAVE_EDGE',
  'LEAVE_NODE',
  'OPEN_WEBSOCKET',
  'PAUSE_TIME_AT_NOW',
  'PIN_METRIC',
  'PIN_NETWORK',
  'PIN_SEARCH',
  'RECEIVE_API_DETAILS',
  'RECEIVE_CONTROL_NODE_REMOVED',
  'RECEIVE_CONTROL_PIPE_STATUS',
  'RECEIVE_CONTROL_PIPE',
  'RECEIVE_ERROR',
  'RECEIVE_NODE_DETAILS',
  'RECEIVE_NODES_DELTA',
  'RECEIVE_NODES_FOR_TOPOLOGY',
  'RECEIVE_NODES',
  'RECEIVE_NOT_FOUND',
  'RECEIVE_SERVICE_IMAGES',
  'RECEIVE_TOPOLOGIES',
  'REQUEST_SERVICE_IMAGES',
  'RESET_LOCAL_VIEW_STATE',
  'RESUME_TIME',
  'ROUTE_TOPOLOGY',
  'SELECT_NETWORK',
  'SET_EXPORTING_GRAPH',
  'SET_RECEIVED_NODES_DELTA',
  'SET_VIEW_MODE',
  'SET_VIEWPORT_DIMENSIONS',
  'SHOW_HELP',
  'SHOW_NETWORKS',
  'SHUTDOWN',
  'SORT_ORDER_CHANGED',
  'START_TIME_TRAVEL',
  'TIME_TRAVEL_START_TRANSITION',
  'TOGGLE_CONTRAST_MODE',
  'TOGGLE_TROUBLESHOOTING_MENU',
  'UNHOVER_METRIC',
  'UNPIN_METRIC',
  'UNPIN_NETWORK',
  'UNPIN_SEARCH',
  // New action types
  'EXPAND_SIDE_NAVIGATION',
  'COLLAPSE_SIDE_NAVIGATION',
  'RECEIVE_ALERT_STATS',
  'RECEIVE_VULNERABILITY_STATS',
  'RECEIVE_AREA_CHART_DATA',
  'SELECT_ALERT_HISTORY_BOUND',
  'SELECT_REFRESH_INTERVAL',
  'SET_SEARCH_QUERY',
  'SET_SEARCH_BAR_VALUE',
  'RECEIVE_SEVERITY_DONUT_DETAILS',
  'RECEIVE_ANOMALY_DONUT_DETAILS',
  'RECEIVE_RESOURCE_DONUT_DETAILS',
  'OPEN_DONUT_DETAILS_MODAL',
  'CLOSE_DONUT_DETAILS_MODAL',
  'RECEIVE_NODE_SPECIFIC_DETAILS',
  // TABLE JSON VIEW MODAL
  'OPEN_TABLE_JSON_MODAL',
  'CLOSE_TABLE_JSON_MODAL',
  'UPDATE_TABLE_JSON_MODAL_VIEW',
  // NODE SEVERITY TYPE
  'RECEIVE_NODE_SEVERITY_TYPE',
  'RECEIVE_ALERT_MASKED_RESPONSE',
  'SET_ACTIVE_SECTOR',
  'SET_ACTIVE_FILTERS',
  // ALERT MASK ACTIONS
  'FOCUS_MASKED_ALERT_ROW',
  'UN_FOCUS_MASKED_ALERT_ROW',
  // THREAT METRIC
  'GET_THREAT_METRIC_DETAILS',
  'RECEIVE_THREAT_METRIC_DETAILS',
  // THREAT MAP
  'GET_TREE_MAP_DETAILS',
  'RECEIVE_TREE_MAP_DETAILS',
  // ALERTS TABLE
  'RECEIVE_ALERTS',
  // THREAT MAP
  'GET_THREAT_MAP_DATA',
  'RECEIVE_THREAT_MAP_DATA',
  // BUBBLE CHART
  'GET_BUBBLE_CHART_DATA',
  'RECEIVE_BUBBLE_CHART_DATA',
  // GEO MAP
  'GET_GEO_MAP_DATA',
  'RECEIVE_GEO_MAP_DATA',
  // FILTERS VIEW
  'TOGGLE_FILTER_VIEW',
  // GET CONTAINERS COUNT
  'GET_CONTAINER_COUNT',
  'RECEIVE_CONTAINER_COUNT',
  // GET HOSTS COUNT
  'GET_HOST_COUNT',
  'RECEIVE_HOST_COUNT',
  // TOPOLOGY FILTERS
  'UPDATE_TOPOLOGY_FILTER',
  // AUTH MODULE
  'RECEIVE_USER_PROFILE',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'RECEIVE_REGISTRATION_RESPONSE',
  'LOGOUT_SUCCESS',
  'LOGOUT_FAILED',
  'PASSWORD_RESET_LINK_RESPONSE',
  'RECEIVE_PASSWORD_CHANGE_RESPONSE',
  'RECEIVE_SIGN_UP_INVITE_RESPONSE',
  'RECEIVE_SIGN_UP_VIA_INVITE_RESPONSE',
  'RECEIVE_EULA_RESPONSE',
  'RECEIVE_LICENSE_KEY_RESPONSE',
  'RECEIVE_LICENSE_STATUS',
  'TOGGLE_NAVBAR_STATE',
  'RECEIVE_ALERT_DELETE_RESPONSE',
  'RECEIVE_NOTIFICATIONS',
  'RECEIVE_INTEGRATION_ADD_RESPONSE',
  'RECEIVE_INTEGRATION_RESPONSE',
  'RESET_INTEGRATION_STATES',
  'RESET_USER_MANAGEMENT_STATES',
  'ENABLE_NOTIFICATION_ICON',
  'DISABLE_NOTIFICATION_ICON',
  'RECEIVE_NOTIFY_ALERT_RESPONSE',
  'TOASTER_NOTIFICATION_SHOW',
  'TOASTER_NOTIFICATION_HIDE',
  'RECEIVE_CVE_BUBBLE_CHART_DATA',
  'RECEIVE_SYSTEM_STATUS'
];

export default zipObject(ACTION_TYPES, ACTION_TYPES);
