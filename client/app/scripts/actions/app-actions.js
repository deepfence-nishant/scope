/*eslint-disable*/
import debug from 'debug';
import { find } from 'lodash';
import { fromJS } from 'immutable';

import ActionTypes from '../constants/action-types';
import { saveGraph } from '../utils/file-utils';
import {disableDashboardAccess, enableDashboardAccess, updateRoute} from '../utils/router-utils';
import {
  doControlRequest,
  getAllNodes,
  getResourceViewNodesSnapshot,
  getNodeDetails,
  getTopologies,
  deletePipe,
  stopPolling,
  teardownWebsockets,
  getNodes,
  fetchNodeSpecificDetails,
  fetchThreatMetricDetails, fetchAlertsData, fetchThreatMapData, fetchBubbleChartData, fetchTreeMapData,
  fetchGeoMapData, getRunningContainers, getRunningHosts, getNodeSeverityType, login, logout, register, getUserProfile,
  getPasswordResetLink, verifyResetPassword, changePassword, inviteForSignUp, registerViaInvite, getEula,
  verifyLicenseKey, getLicenseStatus, deleteAlerts, getNotifications, addMediaIntegration, deleteMediaIntegration,
  updateNotificationSeenStatus, notifyAlerts, getCveBubbleChartData, getSystemStatus
} from '../utils/web-api-utils';
import { storageSet } from '../utils/storage-utils';
import { loadTheme } from '../utils/contrast-utils';
import { isPausedSelector } from '../selectors/time-travel';
import {
  availableMetricTypesSelector,
  nextPinnedMetricTypeSelector,
  previousPinnedMetricTypeSelector,
  pinnedMetricSelector,
} from '../selectors/node-metric';
import {
  isResourceViewModeSelector,
  resourceViewAvailableSelector,
} from '../selectors/topology';

import {
  GRAPH_VIEW_MODE,
  TABLE_VIEW_MODE,
  RESOURCE_VIEW_MODE,
} from '../constants/naming';
import {getLuceneQuery} from "../utils/array-utils";
import {setCompanyLicenseStatus} from "../helpers/auth-helper";


const log = debug('scope:app-actions');


export function showHelp() {
  return { type: ActionTypes.SHOW_HELP };
}


export function hideHelp() {
  return { type: ActionTypes.HIDE_HELP };
}


export function toggleHelp() {
  return (dispatch, getState) => {
    if (getState().get('showingHelp')) {
      dispatch(hideHelp());
    } else {
      dispatch(showHelp());
    }
  };
}


export function sortOrderChanged(sortedBy, sortedDesc) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.SORT_ORDER_CHANGED,
      sortedBy,
      sortedDesc
    });
    updateRoute(getState);
  };
}


//
// Networks
//


export function showNetworks(visible) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.SHOW_NETWORKS,
      visible
    });

    updateRoute(getState);
  };
}


export function selectNetwork(networkId) {
  return {
    type: ActionTypes.SELECT_NETWORK,
    networkId
  };
}

export function pinNetwork(networkId) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.PIN_NETWORK,
      networkId,
    });

    updateRoute(getState);
  };
}

export function unpinNetwork(networkId) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UNPIN_NETWORK,
      networkId,
    });

    updateRoute(getState);
  };
}


//
// Metrics
//

export function hoverMetric(metricType) {
  return {
    type: ActionTypes.HOVER_METRIC,
    metricType,
  };
}

export function unhoverMetric() {
  return {
    type: ActionTypes.UNHOVER_METRIC,
  };
}

export function pinMetric(metricType) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.PIN_METRIC,
      metricType,
    });
    updateRoute(getState);
  };
}

export function unpinMetric() {
  return (dispatch, getState) => {
    // We always have to keep metrics pinned in the resource view.
    if (!isResourceViewModeSelector(getState())) {
      dispatch({
        type: ActionTypes.UNPIN_METRIC,
      });
      updateRoute(getState);
    }
  };
}

export function pinNextMetric() {
  return (dispatch, getState) => {
    const nextPinnedMetricType = nextPinnedMetricTypeSelector(getState());
    dispatch(pinMetric(nextPinnedMetricType));
  };
}

export function pinPreviousMetric() {
  return (dispatch, getState) => {
    const previousPinnedMetricType = previousPinnedMetricTypeSelector(getState());
    dispatch(pinMetric(previousPinnedMetricType));
  };
}

export function pinSearch() {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.PIN_SEARCH,
      query: getState().get('searchQuery'),
    });
    updateRoute(getState);
  };
}

export function unpinSearch(query) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UNPIN_SEARCH,
      query
    });
    updateRoute(getState);
  };
}

export function blurSearch() {
  return { type: ActionTypes.BLUR_SEARCH };
}

export function changeTopologyOption(option, value, topologyId, addOrRemove) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.CHANGE_TOPOLOGY_OPTION,
      topologyId,
      option,
      value,
      addOrRemove
    });
    updateRoute(getState);
    // update all request workers with new options
    getTopologies(getState, dispatch);
    getNodes(getState, dispatch);
  };
}

export function clickBackground() {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.CLICK_BACKGROUND
    });
    updateRoute(getState);
  };
}

export function clickCloseDetails(nodeId) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.CLICK_CLOSE_DETAILS,
      nodeId
    });
    // CLose the adjacent donut details modal
    dispatch(closeDonutDetailsModal());
    // Pull the most recent details for the next details panel that comes into focus.
    getNodeDetails(getState, dispatch);
    updateRoute(getState);
  };
}

export function clickCloseTerminal(pipeId, closePipe) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.CLICK_CLOSE_TERMINAL,
      pipeId
    });
    if (closePipe) {
      deletePipe(pipeId, dispatch);
    }
    updateRoute(getState);
  };
}

export function clickDownloadGraph() {
  return (dispatch) => {
    dispatch({ type: ActionTypes.SET_EXPORTING_GRAPH, exporting: true });
    saveGraph();
    dispatch({ type: ActionTypes.SET_EXPORTING_GRAPH, exporting: false });
  };
}

export function clickForceRelayout() {
  return (dispatch) => {
    dispatch({
      type: ActionTypes.CLICK_FORCE_RELAYOUT,
      forceRelayout: true
    });
    // fire only once, reset after dispatch
    setTimeout(() => {
      dispatch({
        type: ActionTypes.CLICK_FORCE_RELAYOUT,
        forceRelayout: false
      });
    }, 100);
  };
}

export function doSearch(searchQuery) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.DO_SEARCH,
      searchQuery
    });
    updateRoute(getState);
  };
}

export function setViewportDimensions(width, height) {
  return (dispatch) => {
    dispatch({ type: ActionTypes.SET_VIEWPORT_DIMENSIONS, width, height });
  };
}

export function setGraphView() {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.SET_VIEW_MODE,
      viewMode: GRAPH_VIEW_MODE,
    });
    updateRoute(getState);
  };
}

export function setTableView() {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.SET_VIEW_MODE,
      viewMode: TABLE_VIEW_MODE,
    });
    updateRoute(getState);
  };
}

export function setResourceView() {
  return (dispatch, getState) => {
    if (resourceViewAvailableSelector(getState())) {
      dispatch({
        type: ActionTypes.SET_VIEW_MODE,
        viewMode: RESOURCE_VIEW_MODE,
      });
      // Pin the first metric if none of the visible ones is pinned.
      const state = getState();
      if (!pinnedMetricSelector(state)) {
        const firstAvailableMetricType = availableMetricTypesSelector(state).first();
        dispatch(pinMetric(firstAvailableMetricType));
      }
      getResourceViewNodesSnapshot(getState(), dispatch);
      updateRoute(getState);
    }
  };
}

export function clickNode(nodeId, label, origin, topologyId = null) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.CLICK_NODE,
      origin,
      label,
      nodeId,
      topologyId,
    });
    updateRoute(getState);
    getNodeDetails(getState, dispatch);
  };
}

export function pauseTimeAtNow() {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.PAUSE_TIME_AT_NOW
    });
    if (!getState().get('nodesLoaded')) {
      getNodes(getState, dispatch);
      if (isResourceViewModeSelector(getState())) {
        getResourceViewNodesSnapshot(getState(), dispatch);
      }
    }
  };
}

export function clickRelative(nodeId, topologyId, label, origin) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.CLICK_RELATIVE,
      label,
      origin,
      nodeId,
      topologyId
    });
    updateRoute(getState);
    getNodeDetails(getState, dispatch);
  };
}

function updateTopology(dispatch, getState) {
  const state = getState();
  // If we're in the resource view, get the snapshot of all the relevant node topologies.
  if (isResourceViewModeSelector(state)) {
    getResourceViewNodesSnapshot(state, dispatch);
  }
  updateRoute(getState);
  // NOTE: This is currently not needed for our static resource
  // view, but we'll need it here later and it's simpler to just
  // keep it than to redo the nodes delta updating logic.
  getNodes(getState, dispatch);
}

export function clickShowTopologyForNode(topologyId, nodeId) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.CLICK_SHOW_TOPOLOGY_FOR_NODE,
      topologyId,
      nodeId
    });
    updateTopology(dispatch, getState);
  };
}

export function clickTopology(topologyId) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.CLICK_TOPOLOGY,
      topologyId
    });
    updateTopology(dispatch, getState);
  };
}

export function cacheZoomState(zoomState) {
  return {
    type: ActionTypes.CACHE_ZOOM_STATE,
    zoomState
  };
}

export function openWebsocket() {
  return {
    type: ActionTypes.OPEN_WEBSOCKET
  };
}

export function clearControlError(nodeId) {
  return {
    type: ActionTypes.CLEAR_CONTROL_ERROR,
    nodeId
  };
}

export function closeWebsocket() {
  return {
    type: ActionTypes.CLOSE_WEBSOCKET
  };
}

export function doControl(nodeId, control) {
  return (dispatch) => {
    dispatch({
      type: ActionTypes.DO_CONTROL,
      nodeId,
      control
    });
    doControlRequest(nodeId, control, dispatch);
  };
}

export function enterEdge(edgeId) {
  return {
    type: ActionTypes.ENTER_EDGE,
    edgeId
  };
}

export function enterNode(nodeId) {
  return {
    type: ActionTypes.ENTER_NODE,
    nodeId
  };
}

export function focusSearch() {
  return (dispatch, getState) => {
    dispatch({ type: ActionTypes.FOCUS_SEARCH });
    // update nodes cache to allow search across all topologies,
    // wait a second until animation is over
    // NOTE: This will cause matching recalculation (and rerendering)
    // of all the nodes in the topology, instead applying it only on
    // the nodes delta. The solution would be to implement deeper
    // search selectors with per-node caching instead of per-topology.
    setTimeout(() => {
      getAllNodes(getState(), dispatch);
    }, 1200);
  };
}

export function hitBackspace() {
  return (dispatch, getState) => {
    const state = getState();
    // remove last pinned query if search query is empty
    if (state.get('searchFocused') && !state.get('searchQuery')) {
      const query = state.get('pinnedSearches').last();
      if (query) {
        dispatch({
          type: ActionTypes.UNPIN_SEARCH,
          query
        });
        updateRoute(getState);
      }
    }
  };
}

export function hitEsc() {
  return (dispatch, getState) => {
    const state = getState();
    const controlPipe = state.get('controlPipes').last();
    if (controlPipe && controlPipe.get('status') === 'PIPE_DELETED') {
      dispatch({
        type: ActionTypes.CLICK_CLOSE_TERMINAL,
        pipeId: controlPipe.get('id')
      });
      updateRoute(getState);
      // Don't deselect node on ESC if there is a controlPipe (keep terminal open)
    } else if (state.get('searchFocused')) {
      if (state.get('searchQuery')) {
        dispatch(doSearch(''));
      } else {
        dispatch(blurSearch());
      }
    } else if (state.get('showingHelp')) {
      dispatch(hideHelp());
    } else if (state.get('nodeDetails').last() && !controlPipe) {
      dispatch({ type: ActionTypes.DESELECT_NODE });
      updateRoute(getState);
    }
  };
}

export function leaveEdge(edgeId) {
  return {
    type: ActionTypes.LEAVE_EDGE,
    edgeId
  };
}

export function leaveNode(nodeId) {
  return {
    type: ActionTypes.LEAVE_NODE,
    nodeId
  };
}

export function receiveControlError(nodeId, err) {
  return {
    type: ActionTypes.DO_CONTROL_ERROR,
    nodeId,
    error: err
  };
}

export function receiveControlSuccess(nodeId) {
  return {
    type: ActionTypes.DO_CONTROL_SUCCESS,
    nodeId
  };
}

export function receiveNodeDetails(details, requestTimestamp) {
  return {
    type: ActionTypes.RECEIVE_NODE_DETAILS,
    requestTimestamp,
    details
  };
}

export function updateTopologyFilter(activeContainers) {
  return {
    type: ActionTypes.UPDATE_TOPOLOGY_FILTER,
    activeContainers
  }
}

export function receiveNodesDelta(delta) {
  return (dispatch, getState) => {
    if (!isPausedSelector(getState())) {
      // Allow css-animation to run smoothly by scheduling it to run on the
      // next tick after any potentially expensive canvas re-draws have been
      // completed.
      setTimeout(() => dispatch({ type: ActionTypes.SET_RECEIVED_NODES_DELTA }), 0);

      // When moving in time, we will consider the transition complete
      // only when the first batch of nodes delta has been received. We
      // do that because we want to keep the previous state blurred instead
      // of transitioning over an empty state like when switching topologies.
      if (getState().get('timeTravelTransitioning')) {
        dispatch({ type: ActionTypes.FINISH_TIME_TRAVEL_TRANSITION });
      }
      const hasChanges = delta.add || delta.update || delta.remove || delta.reset;

      /*START:: API CALL TO NODE SEVERITY*/
      const nodesArr = [];
      hasChanges.map(node => {
        const d = node.label;
        nodesArr.push(d);
      });
      if (nodesArr.length > 0) {
        let topologyId = getState().get('currentTopologyId');
          if (topologyId === 'containers'){
            getNodeSeverityType(dispatch, 'container_name', nodesArr);
          } else if (topologyId === 'hosts') {
            getNodeSeverityType(dispatch, 'host', nodesArr);
          }
      }
      /*END:: API CALL TO NODE SEVERITY*/

      /*START :: TOPOLOGY FILTERING*/
      const activeContainers = getState().get('activeContainers') || [];
      if (hasChanges && activeContainers.length > 0 && getState().get('currentTopologyId') === 'containers') {
        let containersToBeShown = [];
        for (let i=0; i<activeContainers.length; i++) {
          let activeContainer = activeContainers[i];
          for (let j=0; j<hasChanges.length; j++) {
            let availableContainer = hasChanges[j];
            if (activeContainer == availableContainer.label) {
              containersToBeShown.push(availableContainer);
            }
          }
        }
        if (delta.add || delta.update || delta.remove) {
            delta.add = containersToBeShown;
            delta.update = null;
            delta.remove = null;
            delta.reset = true;
        }
        dispatch({
          type: ActionTypes.RECEIVE_NODES_DELTA,
          delta
        });
      } else if (hasChanges) {
        dispatch({
          type: ActionTypes.RECEIVE_NODES_DELTA,
          delta
        });
      }
      /*END :: TOPOLOGY FILTERING*/
    }
  };
}

export function resumeTime() {
  return (dispatch, getState) => {
    if (isPausedSelector(getState())) {
      dispatch({
        type: ActionTypes.RESUME_TIME
      });
      // After unpausing, all of the following calls will re-activate polling.
      getTopologies(getState, dispatch);
      getNodes(getState, dispatch, true);
      if (isResourceViewModeSelector(getState())) {
        getResourceViewNodesSnapshot(getState(), dispatch);
      }
    }
  };
}

export function startTimeTravel() {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.START_TIME_TRAVEL
    });
    if (!getState().get('nodesLoaded')) {
      getNodes(getState, dispatch);
      if (isResourceViewModeSelector(getState())) {
        getResourceViewNodesSnapshot(getState(), dispatch);
      }
    } else {
      // Get most recent details before freezing the state.
      getNodeDetails(getState, dispatch);
    }
  };
}

export function receiveNodes(nodes) {
  return {
    type: ActionTypes.RECEIVE_NODES,
    nodes,
  };
}

export function timeTravelStartTransition() {
  return {
    type: ActionTypes.TIME_TRAVEL_START_TRANSITION,
  };
}

export function jumpToTime(timestamp) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.JUMP_TO_TIME,
      timestamp,
    });
    getTopologies(getState, dispatch);
    getNodes(getState, dispatch);
    if (isResourceViewModeSelector(getState())) {
      getResourceViewNodesSnapshot(getState(), dispatch);
    }
  };
}

export function receiveNodesForTopology(nodes, topologyId) {
  return {
    type: ActionTypes.RECEIVE_NODES_FOR_TOPOLOGY,
    nodes,
    topologyId
  };
}

export function receiveTopologies(topologies) {
  return (dispatch, getState) => {
    const firstLoad = !getState().get('topologiesLoaded');
    dispatch({
      type: ActionTypes.RECEIVE_TOPOLOGIES,
      topologies
    });
    getNodes(getState, dispatch);
    // Populate search matches on first load
    const state = getState();
    if (firstLoad && state.get('searchQuery')) {
      dispatch(focusSearch());
    }
    // Fetch all the relevant nodes once on first load
    if (firstLoad && isResourceViewModeSelector(state)) {
      getResourceViewNodesSnapshot(state, dispatch);
    }
  };
}

export function receiveApiDetails(apiDetails) {
  return {
    type: ActionTypes.RECEIVE_API_DETAILS,
    capabilities: fromJS(apiDetails.capabilities),
    hostname: apiDetails.hostname,
    version: apiDetails.version,
    newVersion: apiDetails.newVersion,
    plugins: apiDetails.plugins,
  };
}

export function receiveControlNodeRemoved(nodeId) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.RECEIVE_CONTROL_NODE_REMOVED,
      nodeId
    });
    updateRoute(getState);
  };
}

export function receiveControlPipeFromParams(pipeId, rawTty, resizeTtyControl) {
  // TODO add nodeId
  return {
    type: ActionTypes.RECEIVE_CONTROL_PIPE,
    pipeId,
    rawTty,
    resizeTtyControl
  };
}

export function receiveControlPipe(pipeId, nodeId, rawTty, resizeTtyControl, control) {
  return (dispatch, getState) => {
    const state = getState();
    if (state.get('nodeDetails').last()
      && nodeId !== state.get('nodeDetails').last().id) {
      log('Node was deselected before we could set up control!');
      deletePipe(pipeId, dispatch);
      return;
    }

    const controlPipe = state.get('controlPipes').last();
    if (controlPipe && controlPipe.get('id') !== pipeId) {
      deletePipe(controlPipe.get('id'), dispatch);
    }

    dispatch({
      type: ActionTypes.RECEIVE_CONTROL_PIPE,
      nodeId,
      pipeId,
      rawTty,
      resizeTtyControl,
      control
    });

    updateRoute(getState);
  };
}

export function receiveControlPipeStatus(pipeId, status) {
  return {
    type: ActionTypes.RECEIVE_CONTROL_PIPE_STATUS,
    pipeId,
    status
  };
}

export function receiveError(errorUrl) {
  return {
    errorUrl,
    type: ActionTypes.RECEIVE_ERROR
  };
}

export function receiveNotFound(nodeId, requestTimestamp) {
  return {
    type: ActionTypes.RECEIVE_NOT_FOUND,
    requestTimestamp,
    nodeId,
  };
}

export function setContrastMode(enabled) {
  return (dispatch) => {
    loadTheme(enabled ? 'contrast' : 'normal');
    dispatch({
      type: ActionTypes.TOGGLE_CONTRAST_MODE,
      enabled,
    });
  };
}

export function getTopologiesWithInitialPoll() {
  return (dispatch, getState) => {
    getTopologies(getState, dispatch, true);
  };
}

export function route(urlState) {
  return (dispatch, getState) => {
    dispatch({
      state: urlState,
      type: ActionTypes.ROUTE_TOPOLOGY
    });
    // update all request workers with new options
    getTopologies(getState, dispatch);
    getNodes(getState, dispatch);
    // If we are landing on the resource view page, we need to fetch not only all the
    // nodes for the current topology, but also the nodes of all the topologies that make
    // the layers in the resource view.
    const state = getState();
    if (isResourceViewModeSelector(state)) {
      getResourceViewNodesSnapshot(state, dispatch);
    }
  };
}

export function resetLocalViewState() {
  return (dispatch) => {
    dispatch({type: ActionTypes.RESET_LOCAL_VIEW_STATE});
    storageSet('scopeViewState', '');
    window.location.href = window.location.href.split('#')[0];
  };
}

export function toggleTroubleshootingMenu(ev) {
  if (ev) { ev.preventDefault(); ev.stopPropagation(); }
  return {
    type: ActionTypes.TOGGLE_TROUBLESHOOTING_MENU
  };
}

export function changeInstance() {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.CHANGE_INSTANCE
    });
    updateRoute(getState);
  };
}

export function shutdown() {
  return (dispatch) => {
    stopPolling();
    teardownWebsockets();
    // Exit the time travel mode before unmounting the app.
    dispatch({
      type: ActionTypes.RESUME_TIME
    });
    dispatch({
      type: ActionTypes.SHUTDOWN
    });
  };
}

export function getImagesForService(orgId, serviceId) {
  return (dispatch, getState, { api }) => {
    dispatch({
      type: ActionTypes.REQUEST_SERVICE_IMAGES,
      serviceId
    });

    api.getFluxImages(orgId, serviceId)
      .then((services) => {
        dispatch({
          type: ActionTypes.RECEIVE_SERVICE_IMAGES,
          service: find(services, s => s.ID === serviceId),
          serviceId
        });
      }, ({ errors }) => {
        dispatch({
          type: ActionTypes.RECEIVE_SERVICE_IMAGES,
          errors
        });
      });
  };
}


//
// New Actions
//

export function expandSideNavbar() {
  return {
    type: ActionTypes.EXPAND_SIDE_NAVIGATION
  }
}

export function collapseSideNavbar() {
  return {
    type: ActionTypes.COLLAPSE_SIDE_NAVIGATION
  }
}

export function receiveAlertStats(alertStats) {
  return {
    type: ActionTypes.RECEIVE_ALERT_STATS,
    alertStats
  };
}

export function receiveVulnerabilityStats(vulnerabilityStats) {
  return {
    type: ActionTypes.RECEIVE_VULNERABILITY_STATS,
    vulnerabilityStats
  };
}

export function receiveContainerCount(containerCount) {
  return {
    type: ActionTypes.RECEIVE_CONTAINER_COUNT,
    containerCount
  }
}

export function receiveHostCount(hostCount) {
  return {
    type: ActionTypes.RECEIVE_HOST_COUNT,
    hostCount
  }
}

export function receiveAreaChartData(areaChartData) {
  return {
    type: ActionTypes.RECEIVE_AREA_CHART_DATA,
    areaChartData
  };
}

export function selectAlertHistoryBound(data) {
  return {
    type: ActionTypes.SELECT_ALERT_HISTORY_BOUND,
    data
  };
}

export function selectRefreshInterval(data) {
  return {
    type: ActionTypes.SELECT_REFRESH_INTERVAL,
    data
  };
}

export function setSearchQuery(searchQuery) {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.SET_SEARCH_QUERY,
      searchQuery
    });
    dispatch(toggleFiltersView());
  };
}

export function setSearchBarValue(searchQuery) {
  return {
    type: ActionTypes.SET_SEARCH_BAR_VALUE,
    searchQuery
  };
}


export function receiveDonutDetails(donutType, donutDetails) {
  let action;
  if (donutType === 'severity') {
    action = ActionTypes.RECEIVE_SEVERITY_DONUT_DETAILS;
  } else if (donutType === 'anomaly') {
    action = ActionTypes.RECEIVE_ANOMALY_DONUT_DETAILS;
  } else if (donutType === 'resource_type') {
    action = ActionTypes.RECEIVE_RESOURCE_DONUT_DETAILS;
  }
  return {
    type: action,
    donutDetails
  };
}

export function openDonutDetailsModal() {
  return {
    type: ActionTypes.OPEN_DONUT_DETAILS_MODAL
  };
}

export function closeDonutDetailsModal() {
  return {
    type: ActionTypes.CLOSE_DONUT_DETAILS_MODAL
  };
}

export function setActiveDonut(activeSector, activeDonut, activeNode, activeTopologyId) {
  return (dispatch, getState) => {
    const state = getState();
    const isDonutDetailsModalVisible = state.get('isDonutDetailsModalVisible');
    const days= state.get('alertPanelHistoryBound');
    if (isDonutDetailsModalVisible) {
      // To Do hardcoded value to be store in store or some other logic
      fetchNodeSpecificDetails(dispatch, activeSector, activeDonut, activeNode, activeTopologyId,
        0, 10, 'asc', undefined, undefined, days.value.number, days.value.time_unit);
    } else {
      dispatch(openDonutDetailsModal());
    }
    dispatch(updateActiveDonut(activeSector, activeDonut, activeNode, activeTopologyId));
  };
}

export function toggleFiltersView() {
  return (dispatch, getState) => {
    const state = getState();
    const searchQueryArr = state.get('globalSearchQuery');
    let showFilters;
    if (searchQueryArr.length == 0) {
      showFilters = false;
    } else {
      showFilters = true;
    }
    dispatch({
      type: ActionTypes.TOGGLE_FILTER_VIEW,
      showFilters
    });
  };
}

// Action to update donut active sector
export function updateActiveDonut(activeSector, activeDonut, activeNode, activeTopologyId) {
  return {
    type: ActionTypes.SET_ACTIVE_SECTOR,
    activeDonut,
    activeSector,
    activeNode,
    activeTopologyId
  }
}

// Action to set active filters
export function setActiveFilters(activeFilter, activeOptions) {
  return {
    type: ActionTypes.SET_ACTIVE_FILTERS,
    activeFilter,
    activeOptions
  }
}

export function receiveNodeSpecificDetails(nodeSpecificDetails) {
  return (dispatch, getState) => {
    const state = getState();
    const isAlertMasked = state.get('isAlertMasked');
    dispatch({
      type: ActionTypes.RECEIVE_NODE_SPECIFIC_DETAILS,
      nodeSpecificDetails
    });
    if (isAlertMasked) {
      dispatch(unFocusMaskedAlert());
    }
  }
}

/* START :: Alerts*/
export function receivedAlerts(alertsCollection) {
  return (dispatch, getState) => {
    const state = getState();
    const isAlertMasked = state.get('isAlertMasked');
    dispatch({
      type: ActionTypes.RECEIVE_ALERTS,
      alertsCollection
    });
    if (isAlertMasked) {
      dispatch(unFocusMaskedAlert());
    }
  }
}

export function fetchRunningContainerCount() {
  return (dispatch) => {
    getRunningContainers(dispatch);
  }
}

export function fetchRunningHostCount() {
  return (dispatch) => {
    getRunningHosts(dispatch);
  }
}

export function openJsonTableViewModal() {
  return {
    type: ActionTypes.OPEN_TABLE_JSON_MODAL
  }
}

export function closeJsonTableViewModal() {
  return {
    type: ActionTypes.CLOSE_TABLE_JSON_MODAL
  }
}

export function updateTableJSONModalView(data) {
  return (dispatch) => {
    dispatch({
      type: ActionTypes.UPDATE_TABLE_JSON_MODAL_VIEW,
      data
    });
    dispatch(openJsonTableViewModal());
  };
}

export function reciveNodeSeverityType(nodeSeverityDetails) {
  return {
    type: ActionTypes.RECEIVE_NODE_SEVERITY_TYPE,
    nodeSeverityDetails
  };
}

export function focusMaskedAlert(
  sector, donut, activeNode, activeTopologyId, recordsFrom,
  recordsPerPage, sortOrder, activeFilter, activeOptions,
  number, timeUnit
) {
  return (dispatch) => {
    // Action dispatch for masked alert focus
    dispatch({
      type: ActionTypes.FOCUS_MASKED_ALERT_ROW,
    });
    // Fetching latest alerts on successfully alert masked after 2 seconds
    fetchNodeSpecificDetails(
      dispatch, sector, donut, activeNode, activeTopologyId,
      recordsFrom, recordsPerPage, sortOrder, activeFilter, activeOptions,
      number, timeUnit
    );
  }
}

export function unFocusMaskedAlert() {
  return {
    type: ActionTypes.UN_FOCUS_MASKED_ALERT_ROW
  };
}

export function getThreatMetricDetails() {
  return (dispatch, getState) => {
    fetchThreatMetricDetails(dispatch);
  }
}

export function receivedThreatMetricDetails(response) {
  return {
    type: ActionTypes.RECEIVE_THREAT_METRIC_DETAILS,
    response
  }
}

export function receivedMaskAlertResponse(params) {
  return (dispatch) => {
    // Action dispatch for masked alert focus
    dispatch({
      type: ActionTypes.FOCUS_MASKED_ALERT_ROW,
    });
    // Fetching latest alerts on successfully alert masked after 2 seconds
    fetchAlertsData(dispatch, params);
  }
}

export function getThreatMapData(params) {
  return (dispatch)=> {
    fetchThreatMapData(dispatch, params);
  }
}

export function receiveThreatMapData(response) {
  return {
    type: ActionTypes.RECEIVE_THREAT_MAP_DATA,
    response
  }
}

/* START :: BUBBLE CHART */
export function getResourceBubbleChartData(params) {
  return (dispatch)=> {
    fetchBubbleChartData(dispatch, params);
  }
}

export function receiveBubbleChartData(response) {
  return {
    type: ActionTypes.RECEIVE_BUBBLE_CHART_DATA,
    response
  }
}
/* END :: BUBBLE CHART */

/* START :: TREE MAP */
export function getTreeMapData(params) {
  return (dispatch)=> {
    fetchTreeMapData(dispatch, params);
  }
}

export function receiveTreeMapData(response) {
  return {
    type: ActionTypes.RECEIVE_TREE_MAP_DETAILS,
    response
  }
}
/* END :: TREE MAP */

/* START :: GEO MAP */
export function getGeoMapData(params) {
  return (dispatch)=> {
    fetchGeoMapData(dispatch, params);
  }
}

export function receiveGeoMapData(response) {
  return {
    type: ActionTypes.RECEIVE_GEO_MAP_DATA,
    response
  }
}
/* END :: GEO MAP */

/* START :: AUTH MODULE */
export function authenticateUser(params) {
  return (dispatch)=> {
    login(dispatch, params);
  }
}

export function receiveLoginResponse(response) {
  let action;
  if (response.success) {
    localStorage.setItem('authToken', response.data.access_token);
    localStorage.setItem('refreshToken', response.data.refresh_token);
    setCompanyLicenseStatus(response.data.access_token);
    enableDashboardAccess();
    action = ActionTypes.LOGIN_SUCCESS;
  }
  else {
    action = ActionTypes.LOGIN_FAILED;
  }
  return {
    type: action,
    response
  }
}

export function registerUser(params) {
  return (dispatch)=> {
    register(dispatch, params);
  }
}

export function receiveRegisterResponse(response) {
  if (response.success) {
    localStorage.setItem('authToken', response.data.access_token);
    localStorage.setItem('refreshToken', response.data.refresh_token);
    setCompanyLicenseStatus(response.data.access_token);
    enableDashboardAccess();
  }
  else {
    response.isError = true;
    response.message = response.error.message;
  }
  return {
    type: ActionTypes.RECEIVE_REGISTRATION_RESPONSE,
    response
  }
}

export function registerUserViaInvite(params) {
  return (dispatch)=> {
    registerViaInvite(dispatch, params);
  }
}

export function receiveRegisterViaInviteResponse(response) {
  if (response.success) {
    localStorage.setItem('authToken', response.data.access_token);
    localStorage.setItem('refreshToken', response.data.refresh_token);
    setCompanyLicenseStatus(response.data.access_token);
    enableDashboardAccess();
  }
  else {
    response.isError = true;
    response.message = response.error.message;
  }
  return {
    type: ActionTypes.RECEIVE_SIGN_UP_VIA_INVITE_RESPONSE,
    response
  }
}

export function logoutUser() {
  return (dispatch) => {
    logout(dispatch);
  }
}

export function receiveLogoutResponse() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("licenseStatus");
  disableDashboardAccess();
  return {
    type: ActionTypes.LOGOUT_SUCCESS
  }
}

export function fetchUserProfile() {
  return (dispatch) => {
    getUserProfile(dispatch);
  }
}

export function receiveUserProfileResponse(response) {
  return {
    type: ActionTypes.RECEIVE_USER_PROFILE,
    response
  }
}

export function requestPasswordResetLink(params) {
  return (dispatch) => {
    getPasswordResetLink(dispatch, params);
  }
}

export function receivePasswordResetLinkResponse(response) {
  if (response.success) {
    response.isSuccess = true;
    response.isError = false;
    response.message = response.data;
  }
  else {
    response.isSuccess = false;
    response.isError = true;
    response.message = response.error.message;
  }
  return {
    type: ActionTypes.PASSWORD_RESET_LINK_RESPONSE,
    response
  }
}

export function requestPasswordReset(params) {
  return (dispatch) => {
    verifyResetPassword(dispatch, params)
  }
}

export function receiveVerifyPasswordResponse(response) {
  if (response.success) {
    response.isSuccess = true;
    response.isError = false;
    response.message = response.data;
  }
  else {
    response.isSuccess = false;
    response.isError = true;
    response.message = response.error.message;
  }
  return {
    type: ActionTypes.PASSWORD_RESET_LINK_RESPONSE,
    response
  }
}

export function requestPasswordChange(params) {
  return (dispatch) => {
    changePassword(dispatch, params)
  }
}

export function receiveChangePasswordResponse(response) {
  if (response.success) {
    response.isSuccess = true;
    response.isError = false;
    response.message = response.data;
  }
  else {
    response.isSuccess = false;
    response.isError = true;
    response.message = response.error.message;
  }
  return {
    type: ActionTypes.RECEIVE_PASSWORD_CHANGE_RESPONSE,
    response
  }
}

export function sendSignUpInvite(params) {
  return (dispatch) => {
    inviteForSignUp(dispatch, params)
  }
}

export function receiveSignUpInviteResponse(response) {
  if (response.success) {
    response.isSuccess = true;
    response.isError = false;
    response.message = response.data;
  }
  else {
    response.isSuccess = false;
    response.isError = true;
    response.message = response.error.message;
  }
  return {
    type: ActionTypes.RECEIVE_SIGN_UP_INVITE_RESPONSE,
    response
  }
}
/* END :: AUTH MODULE */

/* START :: EULA */
export function fetchEula() {
  return (dispatch) => {
    getEula(dispatch);
  }
}

export function receiveEulaResponse(response) {
  return {
    type: ActionTypes.RECEIVE_EULA_RESPONSE,
    response
  }
}
/* END :: EULA */

/* START :: LICENSE */
export function fetchLicenseStatus() {
  return (dispatch) => {
    getLicenseStatus(dispatch);
  }
}

export function receiveLicenseStatus(response) {
  if (response.success) {
    response.isSuccess = true;
    response.isError = false;
    response.licenseResponse = response.data;
  } else {
    response.isSuccess = false;
    response.isError = true;
    response.licenseResponse = response.error.message;
  }
  return {
    type: ActionTypes.RECEIVE_LICENSE_STATUS,
    response
  }
}

export function submitLicense(params) {
  return (dispatch) => {
    verifyLicenseKey(dispatch, params);
  }
}

export function receiveLicenseSubmitResponse(response) {
  if (response.success) {
    response.isSuccess = true;
    response.isError = false;
    response.licenseResponse = response.data;
    localStorage.setItem('licenseStatus', true);
  } else {
    response.isSuccess = false;
    response.isError = true;
    response.licenseResponse = response.error.message;
  }
  return {
    type: ActionTypes.RECEIVE_LICENSE_KEY_RESPONSE,
    response
  }
}

export function toggleNavbarState(response) {
  return {
    type: ActionTypes.TOGGLE_NAVBAR_STATE,
    response
  }
}
/* END :: LICENSE */

/* START :: ALERTS MANAGEMENT */
export function submitAlertsDeleteRequest(params) {
  return (dispatch)=> {
    deleteAlerts(dispatch, params);
  }
}

export function receiveAlertsDeleteResponse(response) {
  if (response.success) {
    response.isSuccess = true;
    response.isError = false;
    response.alertsDeleteResponse = response.data.message;
  } else {
    response.isSuccess = false;
    response.isError = true;
    response.alertsDeleteResponse = response.error.message;
  }
  return {
    type: ActionTypes.RECEIVE_ALERT_DELETE_RESPONSE,
    response
  }
}
/* END :: ALERTS MANAGEMENT */

/* START :: NOTIFICATION */
export function pollNotification(params) {
  return (dispatch)=> {
    getNotifications(dispatch, params);
  }
}

export function receiveNotifications(response) {
  return {
    type: ActionTypes.RECEIVE_NOTIFICATIONS,
    response
  }
}

export function enableNotificationIcon() {
  return {
    type: ActionTypes.ENABLE_NOTIFICATION_ICON
  }
}

export function disableNotificationIcon() {
  return {
    type: ActionTypes.DISABLE_NOTIFICATION_ICON
  }
}

export function markNotificationAsSeen() {
  return (dispatch)=> {
    updateNotificationSeenStatus(dispatch);
  }
}

/* END :: NOTIFICATION */

/* START :: INTEGRATION */
export function submitIntegrationRequest(params) {
  return (dispatch)=> {
    addMediaIntegration(dispatch, params);
  }
}

export function receiveIntegrationAddResponse(response) {
  if (response.success) {
    response.isSuccess = true;
    response.isError = false;
    response.integrationAddResponse = response.data.message;
  } else {
    response.isSuccess = false;
    response.isError = true;
    response.integrationAddResponse = response.error.message;
  }
  return {
    type: ActionTypes.RECEIVE_INTEGRATION_ADD_RESPONSE,
    response
  }
}

export function receiveIntegrations(response) {
  return {
    type: ActionTypes.RECEIVE_INTEGRATION_RESPONSE,
    response
  }
}

export function requestIntegrationDelete(params) {
  return (dispatch)=> {
    deleteMediaIntegration(dispatch, params);
  }
}

export function resetIntegrationStates() {
  return {
    type: ActionTypes.RESET_INTEGRATION_STATES,
  }
}

export function resetUserProfileStates() {
  return {
    type: ActionTypes.RESET_USER_MANAGEMENT_STATES,
  }
}

/* END :: INTEGRATION */

/* START :: MANUAL NOTIFICATION */
export function requestManualAlertNotification(params) {
  return (dispatch)=> {
    notifyAlerts(dispatch, params);
  }
}

export function receiveNotifyAlertsResponse(response) {
  // Action dispatch for notified alerts unfocus
  let result;
  if (response.success) {
    result = ActionTypes.FOCUS_MASKED_ALERT_ROW;
  } else {
    result = ActionTypes.TOASTER_NOTIFICATION_SHOW;
  }
  return {
    type: result,
    response
  }
}

export function hideToaster() {
  return {
    type: ActionTypes.TOASTER_NOTIFICATION_HIDE
  }
}
/* END :: MANUAL NOTIFICATION */

/* START :: CVE BUBBLE CHART */
export function fetchCveBubbleChartData(params) {
  return (dispatch)=> {
    getCveBubbleChartData(dispatch, params);
  }
}

export function receiveCveBubbleChartData(response) {

  // Bubble chart testing code, to be removed later
  /*for (let i=0;i<response.data.length; i++){
    let record = response.data[i];
    record.count = Math.floor((Math.random() * 1000) + 1);
  }

  let dataCopy = JSON.parse(JSON.stringify(response.data));
  for (let j=0;j<dataCopy.length; j++){
    let record = dataCopy[j];
    record.cve_id = Math.floor((Math.random() * 10000) + 1);
    response.data.push(record);
  }*/

  /*let anotherDataCopy = JSON.parse(JSON.stringify(response.data));
  for (let k=0;k<anotherDataCopy.length; k++){
    let record = anotherDataCopy[k];
    record.cve_id = Math.floor((Math.random() * 1040600) + 1);
    response.data.push(record);
  }*/

  return {
    type: ActionTypes.RECEIVE_CVE_BUBBLE_CHART_DATA,
    response
  }
}
/* END :: CVE BUBBLE CHART */

/* START :: SYSTEM STATUS */
export function fetchSystemStatus(params) {
  return (dispatch)=> {
    getSystemStatus(dispatch, params);
  }
}

export function receiveSystemStatus(response) {
  return {
    type: ActionTypes.RECEIVE_SYSTEM_STATUS,
    response
  }
}
/* END :: SYSTEM STATUS */