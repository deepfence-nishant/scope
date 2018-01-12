/*eslint-disable*/

import debug from 'debug';
import reqwest from 'reqwest';
import { defaults } from 'lodash';
import { Map as makeMap, List } from 'immutable';

import {
  blurSearch, clearControlError, closeWebsocket, openWebsocket, receiveError,
  receiveApiDetails, receiveNodesDelta, receiveNodeDetails, receiveControlError,
  receiveControlNodeRemoved, receiveControlPipe, receiveControlPipeStatus,
  receiveControlSuccess, receiveTopologies, receiveNotFound,
  receiveNodesForTopology, receiveNodes, receiveAlertStats, receiveDonutDetails,
  receiveNodeSpecificDetails, receiveAreaChartData, closeDonutDetailsModal, reciveNodeSeverityType,
  focusMaskedAlert, receivedThreatMetricDetails, receivedAlerts, receivedMaskAlertResponse, receiveThreatMapData,
  receiveBubbleChartData, receiveTreeMapData, receiveGeoMapData, receiveContainerCount, receiveHostCount,
  receiveLoginResponse, receiveLogoutResponse, receiveRegisterResponse, receiveUserProfileResponse,
  receivePasswordResetLinkResponse, receiveVerifyPasswordResponse, receiveChangePasswordResponse,
  receiveSignUpInviteResponse, receiveRegisterViaInviteResponse, receiveEulaResponse, receiveLicenseSubmitResponse,
  receiveLicenseStatus, toggleNavbarState, receiveAlertsDeleteResponse, receiveNotifications,
  receiveIntegrationAddResponse, receiveIntegrations, receiveIntegrationDeleteResponse, receiveNotificationMarkResponse,
  disableNotificationIcon, receiveNotifyAlertsResponse, receiveCveBubbleChartData, receiveVulnerabilityStats,
  receiveSystemStatus
} from '../actions/app-actions';

import { getCurrentTopologyUrl } from '../utils/topology-utils';
import { layersTopologyIdsSelector } from '../selectors/resource-view/layout';
import { activeTopologyOptionsSelector } from '../selectors/topology';
import { isPausedSelector } from '../selectors/time-travel';

import { API_REFRESH_INTERVAL, TOPOLOGY_REFRESH_INTERVAL } from '../constants/timer';
import {
  getLuceneQuery
} from './array-utils';
import {
  getAuthHeader, getRefreshToken, setCompanyLicenseStatus
} from '../helpers/auth-helper';

const log = debug('scope:web-api-utils');

const reconnectTimerInterval = 5000;

const updateFrequency = '5s';
const FIRST_RENDER_TOO_LONG_THRESHOLD = 100; // ms
const csrfToken = (() => {
  // Check for token at window level or parent level (for iframe);
  /* eslint-disable no-underscore-dangle */
  const token = typeof window !== 'undefined'
    ? window.__WEAVEWORKS_CSRF_TOKEN || parent.__WEAVEWORKS_CSRF_TOKEN
    : null;
  /* eslint-enable no-underscore-dangle */
  if (!token || token === '$__CSRF_TOKEN_PLACEHOLDER__') {
    // Authfe did not replace the token in the static html.
    return null;
  }

  return token;
})();

let socket;
let reconnectTimer = 0;
let topologyTimer = 0;
let apiDetailsTimer = 0;
let controlErrorTimer = 0;
let currentUrl = null;
let createWebsocketAt = null;
let firstMessageOnWebsocketAt = null;
let continuePolling = true;

// Method to return backend API end point
export function backendElasticApiEndPoint() {
  return 'http://ec2-13-59-65-151.us-east-2.compute.amazonaws.com:9999';
}

export function getSerializedTimeTravelTimestamp(state) {
  // The timestamp parameter will be used only if it's in the past.
  if (!isPausedSelector(state)) return null;
  return state.get('pausedAt').toISOString();
}

export function buildUrlQuery(params = makeMap(), state) {
  // Attach the time travel timestamp to every request to the backend.
  params = params.set('timestamp', getSerializedTimeTravelTimestamp(state));

  // Ignore the entries with values `null` or `undefined`.
  return params.map((value, param) => {
    if (value === undefined || value === null) return null;
    if (List.isList(value)) {
      value = value.join(',');
    }
    return `${param}=${value}`;
  }).filter(s => s).join('&');
}

export function basePath(urlPath) {
  //
  // "/scope/terminal.html" -> "/scope"
  // "/scope/" -> "/scope"
  // "/scope" -> "/scope"
  // "/" -> ""
  //
  const parts = urlPath.split('/');
  // if the last item has a "." in it, e.g. foo.html...
  if (parts[parts.length - 1].indexOf('.') !== -1) {
    return parts.slice(0, -1).join('/');
  }
  return parts.join('/').replace(/\/$/, '');
}

export function basePathSlash(urlPath) {
  //
  // "/scope/terminal.html" -> "/scope/"
  // "/scope/" -> "/scope/"
  // "/scope" -> "/scope/"
  // "/" -> "/"
  //
  return `${basePath(urlPath)}/`;
}

export function getApiPath(pathname = window.location.pathname) {

  return "http://127.0.0.1:4040";
//  if (process.env.SCOPE_API_PREFIX) {
//    return basePath(`${process.env.SCOPE_API_PREFIX}${pathname}`);
//  }
//  return basePath(pathname);
}

function topologiesUrl(state) {
  const activeTopologyOptions = activeTopologyOptionsSelector(state);
  const optionsQuery = buildUrlQuery(activeTopologyOptions, state);
  return `${getApiPath()}/api/topology?${optionsQuery}`;
}

export function getWebsocketUrl(host = window.location.host, pathname = window.location.pathname) {
  const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${wsProto}://${host}${process.env.SCOPE_API_PREFIX || ''}${basePath(pathname)}`;
}

function buildWebsocketUrl(topologyUrl, topologyOptions = makeMap(), state) {
  topologyOptions = topologyOptions.set('t', updateFrequency);
  const optionsQuery = buildUrlQuery(topologyOptions, state);
  return `${getWebsocketUrl()}${topologyUrl}/ws?${optionsQuery}`;
}

function createWebsocket(websocketUrl, getState, dispatch) {
  if (socket) {
    socket.onclose = null;
    socket.onerror = null;
    socket.close();
    // onclose() is not called, but that's fine since we're opening a new one
    // right away
  }

  // profiling
  createWebsocketAt = new Date();
  firstMessageOnWebsocketAt = null;

  socket = new WebSocket(websocketUrl);

  socket.onopen = () => {
    log(`Opening websocket to ${websocketUrl}`);
    dispatch(openWebsocket());
  };

  socket.onclose = () => {
    clearTimeout(reconnectTimer);
    log(`Closing websocket to ${websocketUrl}`, socket.readyState);
    socket = null;
    dispatch(closeWebsocket());

    if (continuePolling && !isPausedSelector(getState())) {
      reconnectTimer = setTimeout(() => {
        createWebsocket(websocketUrl, getState, dispatch);
      }, reconnectTimerInterval);
    }
  };

  socket.onerror = () => {
    log(`Error in websocket to ${websocketUrl}`);
    dispatch(receiveError(websocketUrl));
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    dispatch(receiveNodesDelta(msg));

    // profiling (receiveNodesDelta triggers synchronous render)
    if (!firstMessageOnWebsocketAt) {
      firstMessageOnWebsocketAt = new Date();
      const timeToFirstMessage = firstMessageOnWebsocketAt - createWebsocketAt;
      if (timeToFirstMessage > FIRST_RENDER_TOO_LONG_THRESHOLD) {
        log('Time (ms) to first nodes render after websocket was created',
          firstMessageOnWebsocketAt - createWebsocketAt);
      }
    }
  };
}

/**
  * XHR wrapper. Applies a CSRF token (if it exists) and content-type to all requests.
  * Any opts that get passed in will override the defaults.
  */
function doRequest(opts) {
  const config = defaults(opts, {
    contentType: 'application/json',
    type: 'json'
  });
  if (csrfToken) {
    config.headers = Object.assign({}, config.headers, { 'X-CSRF-Token': csrfToken });
  }

  return reqwest(config);
}

/**
 * Does a one-time fetch of all the nodes for a custom list of topologies.
 */
function getNodesForTopologies(state, dispatch, topologyIds, topologyOptions = makeMap()) {
  // fetch sequentially
  state.get('topologyUrlsById')
    .filter((_, topologyId) => topologyIds.contains(topologyId))
    .reduce((sequence, topologyUrl, topologyId) => sequence.then(() => {
      const optionsQuery = buildUrlQuery(topologyOptions.get(topologyId), state);
      return doRequest({ url: `${getApiPath()}${topologyUrl}?${optionsQuery}` });
    })
    .then(json => dispatch(receiveNodesForTopology(json.nodes, topologyId))),
    Promise.resolve());
}

function getNodesOnce(getState, dispatch) {
  const state = getState();
  const topologyUrl = getCurrentTopologyUrl(state);
  const topologyOptions = activeTopologyOptionsSelector(state);
  const optionsQuery = buildUrlQuery(topologyOptions, state);
  const url = `${getApiPath()}${topologyUrl}?${optionsQuery}`;
  doRequest({
    url,
    success: (res) => {
      dispatch(receiveNodes(res.nodes));
    },
    error: (req) => {
      log(`Error in nodes request: ${req.responseText}`);
      dispatch(receiveError(url));
    }
  });
}

/**
 * Gets nodes for all topologies (for search).
 */
export function getAllNodes(state, dispatch) {
  const topologyOptions = state.get('topologyOptions');
  const topologyIds = state.get('topologyUrlsById').keySeq();
  getNodesForTopologies(state, dispatch, topologyIds, topologyOptions);
}

/**
 * One-time update of all the nodes of topologies that appear in the current resource view.
 * TODO: Replace the one-time snapshot with periodic polling.
 */
export function getResourceViewNodesSnapshot(state, dispatch) {
  const topologyIds = layersTopologyIdsSelector(state);
  getNodesForTopologies(state, dispatch, topologyIds);
}

function pollTopologies(getState, dispatch, initialPoll = false) {
  // Used to resume polling when navigating between pages in Weave Cloud.
  continuePolling = initialPoll === true ? true : continuePolling;
  clearTimeout(topologyTimer);
  // NOTE: getState is called every time to make sure the up-to-date state is used.
  const url = topologiesUrl(getState());
  doRequest({
    url,
    success: (res) => {
      if (continuePolling && !isPausedSelector(getState())) {
        dispatch(receiveTopologies(res));
        topologyTimer = setTimeout(() => {
          pollTopologies(getState, dispatch);
        }, TOPOLOGY_REFRESH_INTERVAL);
      }
    },
    error: (req) => {
      log(`Error in topology request: ${req.responseText}`);
      dispatch(receiveError(url));
      // Only retry in stand-alone mode
      if (continuePolling && !isPausedSelector(getState())) {
        topologyTimer = setTimeout(() => {
          pollTopologies(getState, dispatch);
        }, TOPOLOGY_REFRESH_INTERVAL);
      }
    }
  });
}

function getTopologiesOnce(getState, dispatch) {
  const url = topologiesUrl(getState());
  doRequest({
    url,
    success: (res) => {
      dispatch(receiveTopologies(res));
    },
    error: (req) => {
      log(`Error in topology request: ${req.responseText}`);
      dispatch(receiveError(url));
    }
  });
}

function updateWebsocketChannel(getState, dispatch, forceRequest) {
  const topologyUrl = getCurrentTopologyUrl(getState());
  const topologyOptions = activeTopologyOptionsSelector(getState());
  const websocketUrl = buildWebsocketUrl(topologyUrl, topologyOptions, getState());
  // Only recreate websocket if url changed or if forced (weave cloud instance reload);
  const isNewUrl = websocketUrl !== currentUrl;
  // `topologyUrl` can be undefined initially, so only create a socket if it is truthy
  // and no socket exists, or if we get a new url.
  if (topologyUrl && (!socket || isNewUrl || forceRequest)) {
    createWebsocket(websocketUrl, getState, dispatch);
    currentUrl = websocketUrl;
  }
}

export function getNodeDetails(getState, dispatch) {
  const state = getState();
  const nodeMap = state.get('nodeDetails');
  const topologyUrlsById = state.get('topologyUrlsById');
  const currentTopologyId = state.get('currentTopologyId');
  const requestTimestamp = state.get('pausedAt');

  // get details for all opened nodes
  const obj = nodeMap.last();
  if (obj && topologyUrlsById.has(obj.topologyId)) {
    const topologyUrl = topologyUrlsById.get(obj.topologyId);
    let urlComponents = [getApiPath(), topologyUrl, '/', encodeURIComponent(obj.id)];

    // Only forward filters for nodes in the current topology.
    const topologyOptions = currentTopologyId === obj.topologyId
      ? activeTopologyOptionsSelector(state) : makeMap();

    const query = buildUrlQuery(topologyOptions, state);
    if (query) {
      urlComponents = urlComponents.concat(['?', query]);
    }
    const url = urlComponents.join('');

    doRequest({
      url,
      success: (res) => {
        // make sure node is still selected
        if (nodeMap.has(res.node.id)) {
          dispatch(receiveNodeDetails(res.node, requestTimestamp));
        }
      },
      error: (err) => {
        log(`Error in node details request: ${err.responseText}`);
        // dont treat missing node as error
        if (err.status === 404) {
          dispatch(receiveNotFound(obj.id, requestTimestamp));
        } else {
          dispatch(receiveError(topologyUrl));
        }
      }
    });
  } else if (obj) {
    log('No details or url found for ', obj);
  }
}

export function getTopologies(getState, dispatch, forceRequest) {
  if (isPausedSelector(getState())) {
    getTopologiesOnce(getState, dispatch);
  } else {
    pollTopologies(getState, dispatch, forceRequest);
  }
}

export function getNodes(getState, dispatch, forceRequest = false) {
  if (isPausedSelector(getState())) {
    getNodesOnce(getState, dispatch);
  } else {
    updateWebsocketChannel(getState, dispatch, forceRequest);
  }
  getNodeDetails(getState, dispatch);
}

export function getApiDetails(dispatch) {
  clearTimeout(apiDetailsTimer);
  const url = `${getApiPath()}/api`;
  doRequest({
    url,
    success: (res) => {
      dispatch(receiveApiDetails(res));
      if (continuePolling) {
        apiDetailsTimer = setTimeout(() => {
          getApiDetails(dispatch);
        }, API_REFRESH_INTERVAL);
      }
    },
    error: (req) => {
      log(`Error in api details request: ${req.responseText}`);
      receiveError(url);
      if (continuePolling) {
        apiDetailsTimer = setTimeout(() => {
          getApiDetails(dispatch);
        }, API_REFRESH_INTERVAL / 2);
      }
    }
  });
}

export function doControlRequest(nodeId, control, dispatch) {
  clearTimeout(controlErrorTimer);
  const url = `${getApiPath()}/api/control/${encodeURIComponent(control.probeId)}/`
    + `${encodeURIComponent(control.nodeId)}/${control.id}`;
  doRequest({
    method: 'POST',
    url,
    success: (res) => {
      dispatch(receiveControlSuccess(nodeId));
      if (res) {
        if (res.pipe) {
          dispatch(blurSearch());
          const resizeTtyControl = res.resize_tty_control &&
            {id: res.resize_tty_control, probeId: control.probeId, nodeId: control.nodeId};

          // Closing table view of donut details.
          dispatch(closeDonutDetailsModal());

          dispatch(receiveControlPipe(
            res.pipe,
            nodeId,
            res.raw_tty,
            resizeTtyControl,
            control
          ));
        }
        if (res.removedNode) {
          dispatch(receiveControlNodeRemoved(nodeId));
        }
      }
    },
    error: (err) => {
      dispatch(receiveControlError(nodeId, err.response));
      controlErrorTimer = setTimeout(() => {
        dispatch(clearControlError(nodeId));
      }, 10000);
    }
  });
}

export function doResizeTty(pipeId, control, cols, rows) {
  const url = `${getApiPath()}/api/control/${encodeURIComponent(control.probeId)}/`
    + `${encodeURIComponent(control.nodeId)}/${control.id}`;

  return doRequest({
    method: 'POST',
    url,
    data: JSON.stringify({pipeID: pipeId, width: cols.toString(), height: rows.toString()}),
  })
    .fail((err) => {
      log(`Error resizing pipe: ${err}`);
    });
}

export function deletePipe(pipeId, dispatch) {
  const url = `${getApiPath()}/api/pipe/${encodeURIComponent(pipeId)}`;
  doRequest({
    method: 'DELETE',
    url,
    success: () => {
      log('Closed the pipe!');
    },
    error: (err) => {
      log(`Error closing pipe:${err}`);
      dispatch(receiveError(url));
    }
  });
}

export function getPipeStatus(pipeId, dispatch) {
  const url = `${getApiPath()}/api/pipe/${encodeURIComponent(pipeId)}/check`;
  doRequest({
    method: 'GET',
    url,
    complete: (res) => {
      const status = {
        204: 'PIPE_ALIVE',
        404: 'PIPE_DELETED'
      }[res.status];

      if (!status) {
        log('Unexpected pipe status:', res.status);
        return;
      }

      dispatch(receiveControlPipeStatus(pipeId, status));
    }
  });
}

export function stopPolling() {
  clearTimeout(apiDetailsTimer);
  clearTimeout(topologyTimer);
  continuePolling = false;
}

export function teardownWebsockets() {
  clearTimeout(reconnectTimer);
  if (socket) {
    socket.onerror = null;
    socket.onclose = null;
    socket.onmessage = null;
    socket.onopen = null;
    socket.close();
    socket = null;
    currentUrl = null;
  }
}

//
// NEW API
//

/* START :: AUTH SECURE APIs */
export function getAlertStats(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/stats?number=${params.number}&time_unit=${params.time_unit}&_type=${params._type}`;

  // Getting lucene query in string format out of array.
  let luceneQuery = getLuceneQuery(params.lucene_query);
  if (luceneQuery) {
    url = `${url}&lucene_query=${encodeURIComponent(luceneQuery)}`;
  }
  doRequest({
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    },
    success: (res) => {
      const alertStatsData = res.data;
      if (params._type == 'alert') {
        dispatch(receiveAlertStats(alertStatsData));
      } else if (params._type == 'cve') {
        dispatch(receiveVulnerabilityStats(alertStatsData))
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api alerts stats request: ${error}`);
      }
    }
  });
};

export function getAreaChartData(dispatch, queryParams) {
  let url = `${backendElasticApiEndPoint()}/area-chart?number=${queryParams.number}&time_unit=${queryParams.time_unit}`;
  let luceneQuery = getLuceneQuery(queryParams.lucene_query);
  if (luceneQuery) {
    url = `${url}&lucene_query=${encodeURIComponent(luceneQuery)}`;
  }
  doRequest({
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    success: (res) => {
      const areaChartData = res.data;
      dispatch(receiveAreaChartData(areaChartData));
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api info request: ${error}`);
      }
    }
  });
};

export function getDonutDetails(dispatch, donutType, params) {
  let url = `${backendElasticApiEndPoint()}/donut?field=${donutType}&number=${params.number}&time_unit=${params.time_unit}`;
  // Getting lucene query in string format out of array.
  if (params.lucene_query){
    let luceneQuery = getLuceneQuery(params.lucene_query);
    if (luceneQuery) {
      url = `${url}&lucene_query=${encodeURIComponent(luceneQuery)}`;
    }
  }
  let body;
  if (params.active_topology && params.active_topology === 'hosts') {
    body = JSON.stringify({host: params.active_container.toString()});
  } else if (params.active_topology && params.active_topology === 'containers'){
    body = JSON.stringify({container_name: params.active_container.toString()});
  } else {
    body = JSON.stringify({})
  }
  doRequest({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    data: body,
    success: (res) => {
      if (res.success) {
        const donutDetails = res.data;
        dispatch(receiveDonutDetails(donutType, donutDetails));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api donut request: ${error}`);
      }
    }
  });
};

export function fetchNodeSpecificDetails(
  dispatch, sector, donut, activeNode, activeTopologyId,
  recordsFrom, recordsPerPage, sortOrder, activeFilter, activeOptions,
  number, time_unit
) {
  const body = {
    _type: 'alert',
    // values_for: ['severity', 'anomaly'],
    filters: {
      masked: [false],
      type: ['alert']
    }
  };
  if (activeTopologyId === 'containers') {
    body.filters['container_name'] = activeNode;
  } else if (activeTopologyId === 'hosts') {
    body.filters['host'] = activeNode;
  }
  if (activeFilter !== undefined) {
    for (const filter in activeFilter) {
      body.filters[filter] = activeOptions[filter];
    }
  } else {
    body.filters[donut] = sector;
  }
  const url = `${backendElasticApiEndPoint()}/search?from=${recordsFrom}&size=${recordsPerPage}&sort_order=${sortOrder}&number=${number}&time_unit=${time_unit}`;
  doRequest({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    data: JSON.stringify(body),
    success: (res) => {
      dispatch(receiveNodeSpecificDetails(res));
      dispatch(receivedAlerts(res));
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api modal details request: ${error}`);
      }
    }
  });
};

export function getNodeSeverityType(dispatch, nodeType, nodes) {
  const url = `${backendElasticApiEndPoint()}/node-severity`;
  const body = {};
  body[nodeType] = nodes;
  doRequest({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    data: JSON.stringify(body),
    success: (res) => {
      if (res.success) {
        const severityData = res.data;
        dispatch(reciveNodeSeverityType(severityData));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api node severity request: ${error}`);
      }
    }
  });
};

export function getRunningContainers(dispatch) {
  const url = `${getApiPath()}/api/topology/containers?system=application&stopped=running&pseudo=hide`;
  doRequest({
    method: 'GET',
    url,
    success: (res) => {
      if (res.nodes) {
        let runningContainerCount = 0;
        const nodesCollection = res.nodes;
        for (let i=0; i<Object.keys(nodesCollection).length; i++) {
          if (nodesCollection[Object.keys(nodesCollection)[i]].shape == 'hexagon') {
            runningContainerCount += 1;
          }
        }
        let obj = {containerCount: runningContainerCount};
        dispatch(receiveContainerCount(obj));
      }
    },
    error: (error) => {
      log(`Error in api container count request: ${error}`);
    }
  });
};

export function getRunningHosts(dispatch) {
  const url = `${getApiPath()}/api/topology/hosts?system=application&stopped=running&pseudo=hide`;
  doRequest({
    method: 'GET',
    url,
    success: (res) => {
      if (res.nodes) {
        let runningHostCount = 0;
        const nodesCollection = res.nodes;
        for (let i=0; i<Object.keys(nodesCollection).length; i++) {
          if (nodesCollection[Object.keys(nodesCollection)[i]].shape == 'circle') {
            runningHostCount += 1;
          }
        }
        let obj = {hostsCount: runningHostCount};
        dispatch(receiveHostCount(obj));
      }
    },
    error: (error) => {
      log(`Error in api host count request: ${error}`);
    }
  });
};

export function maskAlertDocument(
  dispatch, alertsCollection, sector, donut,
  activeNode, activeTopologyId, recordsFrom, recordsPerPage,
  sortOrder, activeFilter, activeOptions, number, timeUnit
) {
  const url = `${backendElasticApiEndPoint()}/mask-doc`;
  let body = {};
  body['docs'] = alertsCollection;
  doRequest({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    data: JSON.stringify(body),
    success: (res) => {
      if (res.success) {
        dispatch(focusMaskedAlert(
          sector, donut, activeNode, activeTopologyId, recordsFrom,
          recordsPerPage, sortOrder, activeFilter, activeOptions, number, timeUnit
        ));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api node severity request: ${error}`);
      }
    }
  });
};

export function fetchThreatMetricDetails(dispatch) {
  const url = `${backendElasticApiEndPoint()}/threat-matrix`;
  doRequest({
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    success: (res) => {
      if (res.success) {
        const threatMetricData = res.data;
        dispatch(receivedThreatMetricDetails(threatMetricData));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api threat metric ${error}`);
      }
    }
  })
};

export function fetchAlertsData(dispatch, params) {
  const body = {
    _type: params.type,
    filters: {
      masked: [false],
      type: params.typeArr
    }
  };
  if (params.hasOwnProperty('activeFilter') || params.activeFilter !== undefined){
    for (const filter in params.activeFilter) {
      body.filters[filter] = params.activeFilter[filter];
    }
  }

  let url = `${backendElasticApiEndPoint()}/search?from=${params.activeIndex}&size=${params.recordsPerPage}&sort_order=${params.sortOrder}&number=${params.number}&time_unit=${params.time_unit}`;
  let luceneQuery = getLuceneQuery(params.lucene_query);
  if (luceneQuery) {
    url = `${url}&lucene_query=${encodeURIComponent(luceneQuery)}`
  }

  doRequest({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    data: JSON.stringify(body),
    success: (res) => {
      dispatch(receivedAlerts(res));
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api modal details request: ${error}`);
      }
    }
  });
};

export function maskAlert(dispatch, params) {
  const url = `${backendElasticApiEndPoint()}/mask-doc`;
  let body = {};
  body['docs'] = params.alertsCollection;
  doRequest({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    data: JSON.stringify(body),
    success: (res) => {
      if (res.success) {
        dispatch(receivedMaskAlertResponse(params));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api node severity request: ${error}`);
      }
    }
  });
};

export function fetchThreatMapData(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/threat-map?number=${params.number}&time_unit=${params.time_unit}`;
  let luceneQuery = getLuceneQuery(params.lucene_query);
  if (luceneQuery){
    url = `${url}&lucene_query=${encodeURIComponent(luceneQuery)}`
  }
  doRequest({
    url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    success: (res) => {
      if (res.success) {
        const threatMapData = res.data.data;
        dispatch(receiveThreatMapData(threatMapData));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api threat map data ${error}`);
      }
    }
  })
};

export function fetchBubbleChartData(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/bubble-chart?number=${params.number}&time_unit=${params.time_unit}`;
  if (params.lucene_query.length != 0) {
    let luceneQuery = getLuceneQuery(params.lucene_query);
    url = `${url}&lucene_query=${encodeURIComponent(luceneQuery)}`
  }
  doRequest({
    url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    success: (res) => {
      if (res.success) {
        const bubbleChartData = res.data.data;
        dispatch(receiveBubbleChartData(bubbleChartData));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api bubble chart ${error}`);
      }
    }
  })
};

export function fetchTreeMapData(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/tree-map?number=${params.number}&time_unit=${params.time_unit}`;
  if (params.lucene_query.length != 0) {
    let luceneQuery = getLuceneQuery(params.lucene_query);
    url = `${url}&lucene_query=${encodeURIComponent(luceneQuery)}`
  }
  doRequest({
    url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    success: (res) => {
      if (res.success) {
        const treeMapData = res.data.data;
        dispatch(receiveTreeMapData(treeMapData));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api tree map ${error}`);
      }
    }
  })
};

export function fetchGeoMapData(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/geo-map?number=${params.number}&time_unit=${params.time_unit}`;
  if (params.lucene_query.length != 0) {
    let luceneQuery = getLuceneQuery(params.lucene_query);
    url = `${url}&lucene_query=${encodeURIComponent(luceneQuery)}`
  }
  doRequest({
    url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    success: (res) => {
      if (res.success) {
        const geoMapData = res.data;
        dispatch(receiveGeoMapData(geoMapData));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api geo map ${error}`);
      }
    }
  })
};
/* END :: AUTH SECURE APIs */

/* START :: AUTH MODULE */
export function login(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/users/login`;
  const body = JSON.parse(JSON.stringify(params));
  doRequest({
    method: 'POST',
    url,
    data: JSON.stringify(body),
    success: (response) => {
      if (response.success) {
        const loginResponse = response;
        dispatch(receiveLoginResponse(loginResponse));
      }
    },
    error: (error) => {
      if (error) {
        dispatch(receiveLoginResponse(JSON.parse(error.response)));
        log(`Error in api login ${error}`);
      }
    }
  });
};

export function register(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/users/register`;
  const body = JSON.parse(JSON.stringify(params));
  doRequest({
    method: 'POST',
    url,
    data: JSON.stringify(body),
    success: (res) => {
      if (res.success) {
        const registerResponse = res;
        dispatch(receiveRegisterResponse(registerResponse));
      }
    },
    error: (error) => {
      if (error) {
        dispatch(receiveRegisterResponse(JSON.parse(error.response)));
        log(`Error in api register ${error}`);
      }
    }
  });
};

export function registerViaInvite(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/users/invite/accept`;
  const body = JSON.parse(JSON.stringify(params));
  doRequest({
    method: 'POST',
    url,
    data: JSON.stringify(body),
    success: (res) => {
      if (res.success) {
        const registerResponse = res;
        dispatch(receiveRegisterViaInviteResponse(registerResponse));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        dispatch(receiveRegisterViaInviteResponse(JSON.parse(error.response)));
        log(`Error in api register via invite ${error}`);
      }
    }
  });
};

export function logout(dispatch) {
  let url = `${backendElasticApiEndPoint()}/users/logout`;
  doRequest({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    success: (res) => {
      if (res.success) {
        const logoutResponse = res;
        dispatch(receiveLogoutResponse(logoutResponse));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api Logout ${error}`);
      }
    }
  });
};

export function getUserProfile(dispatch) {
  let url = `${backendElasticApiEndPoint()}/users/me`;
  doRequest({
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    url,
    success: (res) => {
      if (res.success) {
        const userProfileResponse = res.data;
        dispatch(receiveUserProfileResponse(userProfileResponse));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api user profile ${error}`);
      }
    }
  });
};

export function getPasswordResetLink(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/users/password-reset/email?email=${params.email}`;
  doRequest({
    method: 'GET',
    url,
    success: (res) => {
      if (res.success) {
        const passwordResetLinkResponse = res;
        dispatch(receivePasswordResetLinkResponse(passwordResetLinkResponse));
      }
    },
    error: (error) => {
      if (error) {
        dispatch(receivePasswordResetLinkResponse(JSON.parse(error.response)));
        log(`Error in api password reset link ${error}`);
      }
    }
  });
};

export function verifyResetPassword(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/users/password-reset/verify`;
  const body = JSON.parse(JSON.stringify(params));
  doRequest({
    method: 'POST',
    url,
    data: JSON.stringify(body),
    success: (res) => {
      if (res.success) {
        const verifyPasswordResponse = res;
        dispatch(receiveVerifyPasswordResponse(verifyPasswordResponse));
      }
    },
    error: (error) => {
      if (error) {
        dispatch(receiveVerifyPasswordResponse(JSON.parse(error.response)));
        log(`Error in api verify password ${error}`);
      }
    }
  });
};

export function changePassword(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/users/password/change`;
  const body = JSON.parse(JSON.stringify(params));
  doRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    url,
    data: JSON.stringify(body),
    success: (res) => {
      if (res.success) {
        const changePasswordResponse = res;
        dispatch(receiveChangePasswordResponse(changePasswordResponse));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        dispatch(receiveChangePasswordResponse(JSON.parse(error.response)));
        log(`Error in api change password ${error}`);
      }
    }
  });
};

export function inviteForSignUp(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/users/invite/send`;
  const body = JSON.parse(JSON.stringify(params));
  doRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    url,
    data: JSON.stringify(body),
    success: (res) => {
      if (res.success) {
        const signUpInviteResponse = res;
        dispatch(receiveSignUpInviteResponse(signUpInviteResponse));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        dispatch(receiveSignUpInviteResponse(JSON.parse(error.response)));
        log(`Error in api sign up invite ${error}`);
      }
    }
  });
};

export function getEula(dispatch) {
  let url = `${backendElasticApiEndPoint()}/eula`;
  doRequest({
    method: 'GET',
    url,
    success: (res) => {
      if (res.success) {
        const eulaResponse = res;
        dispatch(receiveEulaResponse(eulaResponse));
      }
    },
    error: (error) => {
      if (error) {
        log(`Error in api eula ${error}`);
      }
    }
  });
};

export function refreshAuthToken() {
  let url = `${backendElasticApiEndPoint()}/users/refresh/token`;
  doRequest({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getRefreshToken()
    },
    success: (response) => {
      if (response.success) {
        localStorage.setItem("authToken", response.data.access_token);
        localStorage.setItem('refreshToken', response.data.refresh_token);
        setCompanyLicenseStatus(response.data.access_token);
      }
    },
    error: (error) => {
      if (error) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        parent.location.hash = 'login';
        log(`Error in api eula ${error}`);
      }
    }
  });
};

export function getLicenseStatus(dispatch) {
  let url = `${backendElasticApiEndPoint()}/licenses/status`;
  doRequest({
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    success: (response) => {
      if (response.success) {
        const licenseStatusResponse = response;
        dispatch(receiveLicenseStatus(licenseStatusResponse));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else if (error.status == 404) {
        dispatch(toggleNavbarState(false));
        dispatch(receiveLicenseStatus(JSON.parse(error.response)));
      } else {
        dispatch(receiveLicenseStatus(JSON.parse(error.response)));
        log(`Error in api license key ${error}`);
      }
    }
  });
};

export function verifyLicenseKey(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/licenses`;
  const body = JSON.parse(JSON.stringify(params));
  doRequest({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    data: JSON.stringify(body),
    success: (response) => {
      if (response.success) {
        const verifyLicenseResponse = response;
        dispatch(toggleNavbarState(true));
        dispatch(receiveLicenseSubmitResponse(verifyLicenseResponse));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        dispatch(receiveLicenseSubmitResponse(JSON.parse(error.response)));
        log(`Error in api license key ${error}`);
      }
    }
  });
};
/* END :: AUTH MODULE */

/* START :: ALERTS MANAGEMENT */
export function deleteAlerts(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/docs/delete`;
  const body = JSON.parse(JSON.stringify(params));
  doRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    url,
    data: JSON.stringify(body),
    success: (response) => {
      if (response.success) {
        const deleteResponse = response;
        dispatch(receiveAlertsDeleteResponse(deleteResponse));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        dispatch(receiveAlertsDeleteResponse(JSON.parse(error.response)));
        log(`Error in api login ${error}`);
      }
    }
  });
};
/* END :: ALERTS MANAGEMENT */

/* START :: NOTIFICATION */
export function getNotifications(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/dashboard-notifications`;
  doRequest({
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
      'x-hosts': params.xHostCount
    },
    success: (res) => {
      const notificationData = res.data;
      dispatch(receiveNotifications(notificationData));
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api alerts stats request: ${error}`);
      }
    }
  });
};

export function updateNotificationSeenStatus(dispatch) {
  let url = `${backendElasticApiEndPoint()}/dashboard-notifications/seen`;
  doRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    url,
    success: (response) => {
      if (response.success) {
        dispatch(disableNotificationIcon());
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api login ${error}`);
      }
    }
  });
};
/* END :: NOTIFICATION */

/* START :: INTEGRATION */
export function addMediaIntegration(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/users/integrations`;
  const body = JSON.parse(JSON.stringify(params));
  doRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    url,
    data: JSON.stringify(body),
    success: (response) => {
      if (response.success) {
        const integrationAddResponse = response;
        getIntegrations(dispatch);
        dispatch(receiveIntegrationAddResponse(integrationAddResponse));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        dispatch(receiveIntegrationAddResponse(JSON.parse(error.response)));
        log(`Error in api login ${error}`);
      }
    }
  });
};

export function deleteMediaIntegration(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/users/integrations`;
  const body = JSON.parse(JSON.stringify(params));
  doRequest({
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    url,
    data: JSON.stringify(body),
    success: (response) => {
      if (response.status == 204) {
        getIntegrations(dispatch);
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api login ${error}`);
      }
    }
  });
};

export function getIntegrations(dispatch) {
  let url = `${backendElasticApiEndPoint()}/users/integrations`;
  doRequest({
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    },
    success: (res) => {
      const integrationData = res.data;
      dispatch(receiveIntegrations(integrationData));
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api alerts stats request: ${error}`);
      }
    }
  });
};

/* END :: INTEGRATION */

/* START :: MANUAL NOTIFICATION */
export function notifyAlerts(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/integrations/notify`;
  const body = JSON.parse(JSON.stringify(params));
  doRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    },
    url,
    data: JSON.stringify(body),
    success: (response) => {
      if (response.success) {
        const notifyAlertsResponse = response;
        dispatch(receiveNotifyAlertsResponse(notifyAlertsResponse));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        dispatch(receiveNotifyAlertsResponse(JSON.parse(error.response)));
        log(`Error in api login ${error}`);
      }
    }
  });
};
/* END :: MANUAL NOTIFICATION */

/* START :: CVE VULNERABILITY */
export function getCveBubbleChartData(dispatch, params) {
  let url = `${backendElasticApiEndPoint()}/vulnerabilities/bubble_chart?number=${params.number}&time_unit=${params.time_unit}`;
  if (params.lucene_query.length != 0) {
    let luceneQuery = getLuceneQuery(params.lucene_query);
    url = `${url}&lucene_query=${encodeURIComponent(luceneQuery)}`
  }
  doRequest({
    url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    success: (res) => {
      if (res.success) {
        const cveBubbleChartData = res.data;
        dispatch(receiveCveBubbleChartData(cveBubbleChartData));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api geo map ${error}`);
      }
    }
  })
};
/* END :: CVE VULNERABILITY */

/* START :: SYSTEM STATUS */
export function getSystemStatus(dispatch) {
  let url = `${backendElasticApiEndPoint()}/system/status`;
  doRequest({
    url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    success: (res) => {
      if (res.success) {
        const systemStatusData = res.data;
        dispatch(receiveSystemStatus(systemStatusData));
      }
    },
    error: (error) => {
      if (error.status == 401 && error.statusText == 'UNAUTHORIZED') {
        dispatch(receiveLogoutResponse());
      } else {
        log(`Error in api geo map ${error}`);
      }
    }
  })
};
/* END :: SYSTEM STATUS */
