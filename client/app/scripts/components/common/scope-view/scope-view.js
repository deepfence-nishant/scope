/*eslint-disable*/
import debug from 'debug';
import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { debounce } from 'lodash';

import SideNavigation from '../side-navigation/side-navigation';

import Topologies from '../../topologies';
import { getApiDetails } from '../../../utils/web-api-utils';
import {
  focusSearch,
  pinNextMetric,
  pinPreviousMetric,
  hitBackspace,
  hitEsc,
  unpinMetric,
  toggleHelp,
  setGraphView,
  setTableView,
  setResourceView,
  shutdown,
  setViewportDimensions,
  getTopologiesWithInitialPoll, updateTopologyFilter,
} from '../../../actions/app-actions';
import Details from '../../details';
import Nodes from '../../nodes';
import TimeControl from '../../time-control';
import ViewModeSelector from '../../view-mode-selector';
import { getRouter, getUrlState } from '../../../utils/router-utils';
import { trackMixpanelEvent } from '../../../utils/tracking-utils';
import { availableNetworksSelector } from '../../../selectors/node-networks';
import {
  isResourceViewModeSelector,
  isTableViewModeSelector,
  isGraphViewModeSelector,
} from '../../../selectors/topology';
import { VIEWPORT_RESIZE_DEBOUNCE_INTERVAL } from '../../../constants/timer';
import {
  BACKSPACE_KEY_CODE,
  ESC_KEY_CODE,
} from '../../../constants/key-codes';
import DonutDetailsModal from '../../topology-view/donut-details-modal/donut-details-modal';
import TopologyFilterDropDown from '../../topology-view/topology-filter-dropdown/topology-filter-dropdown';

import { getUniqueValuesFromObject } from "../../../utils/array-utils";

const keyPressLog = debug('scope:app-key-press');

class ScopeView extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.sideNavMenuCollection = [
      { name: 'topology', menuIcon: 'icon-Topology', isActive: true, link: '/topology' },
      { name: 'alert', menuIcon: 'icon-alert', isActive: false, link: '/alert' },
      { name: 'vulnerabilities', menuIcon: 'icon-biohazard', isActive: false, link: '/vulnerability' },
      { name: 'notification', menuIcon: 'icon-notification', isActive: false, link: '/notification' },
      { name: 'integrations', menuIcon: 'icon-webhook', isActive: false, link: '/integration' },
      { name: 'settings', menuIcon: 'icon-settings', isActive: false, link: '/settings' },
    ];
    this.state = {
      activeMenu: this.sideNavMenuCollection[0]
    };
    this.setViewportDimensions = this.setViewportDimensions.bind(this);
    this.handleResize = debounce(this.setViewportDimensions, VIEWPORT_RESIZE_DEBOUNCE_INTERVAL);
    this.saveAppRef = this.saveAppRef.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  }

  componentDidMount() {
    this.setViewportDimensions();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keypress', this.onKeyPress);
    window.addEventListener('keyup', this.onKeyUp);

    // getRouter(this.props.dispatch, this.props.urlState).start({hashbang: true});
    getRouter(this.props.dispatch, this.props.urlState);
    if (!this.props.routeSet || process.env.WEAVE_CLOUD) {
      // dont request topologies when already done via router.
      // If running as a component, always request topologies when the app mounts.
      this.props.dispatch(getTopologiesWithInitialPoll());
    }
    if (this.props.nodeSeverity){
      if ((this.props.currentTopologyId == 'containers') || (this.props.currentTopologyId == 'hosts')) {
        this.updateTopologyFilterDropdown(this.props.nodeSeverity);
      }
    }
    getApiDetails(this.props.dispatch);
  }

  componentWillReceiveProps(newProps) {
    if ((newProps.currentTopologyId == 'containers') || (newProps.currentTopologyId == 'hosts')) {
      this.updateTopologyFilterDropdown(newProps.nodeSeverity);
    } else {
      this.setState({availableSeverityOption: undefined});
    }
  }

  componentWillUnmount() {
    window.addEventListener('resize', this.handleResize);
    window.removeEventListener('keypress', this.onKeyPress);
    window.removeEventListener('keyup', this.onKeyUp);
    this.props.dispatch(shutdown());
    this.setState({availableSeverityOption: undefined});
  }

  updateTopologyFilterDropdown(containersWithSeverity) {
    let availableSeverityOption = getUniqueValuesFromObject(containersWithSeverity);
    this.setState({availableSeverityOption: availableSeverityOption});
  }

  onKeyUp(ev) {
    const { showingTerminal } = this.props;
    keyPressLog('onKeyUp', 'keyCode', ev.keyCode, ev);

    // don't get esc in onKeyPress
    if (ev.keyCode === ESC_KEY_CODE) {
      this.props.dispatch(hitEsc());
    } else if (ev.keyCode === BACKSPACE_KEY_CODE) {
      this.props.dispatch(hitBackspace());
    } else if (ev.code === 'KeyD' && ev.ctrlKey && !showingTerminal) {
      // toggleDebugToolbar();
      this.forceUpdate();
    }
  }

  onKeyPress(ev) {
    const { dispatch, searchFocused, showingTerminal } = this.props;
    //
    // keyup gives 'key'
    // keypress gives 'char'
    // Distinction is important for international keyboard layouts where there
    // is often a different {key: char} mapping.
    if (!searchFocused && !showingTerminal) {
      keyPressLog('onKeyPress', 'keyCode', ev.keyCode, ev);
      const char = String.fromCharCode(ev.charCode);
      if (char === '<') {
        dispatch(pinPreviousMetric());
        this.trackEvent('scope.metric.selector.pin.previous.keypress', {
          metricType: this.props.pinnedMetricType
        });
      } else if (char === '>') {
        dispatch(pinNextMetric());
        this.trackEvent('scope.metric.selector.pin.next.keypress', {
          metricType: this.props.pinnedMetricType
        });
      } else if (char === 'g') {
        dispatch(setGraphView());
        this.trackEvent('scope.layout.selector.keypress');
      } else if (char === 't') {
        dispatch(setTableView());
        this.trackEvent('scope.layout.selector.keypress');
      } else if (char === 'r') {
        dispatch(setResourceView());
        this.trackEvent('scope.layout.selector.keypress');
      } else if (char === 'q') {
        this.trackEvent('scope.metric.selector.unpin.keypress', {
          metricType: this.props.pinnedMetricType
        });
        dispatch(unpinMetric());
      } else if (char === '/') {
        ev.preventDefault();
        dispatch(focusSearch());
      } else if (char === '?') {
        dispatch(toggleHelp());
      }
    }
  }

  trackEvent(eventName, additionalProps = {}) {
    trackMixpanelEvent(eventName, {
      layout: this.props.topologyViewMode,
      topologyId: this.props.currentTopology.get('id'),
      parentTopologyId: this.props.currentTopology.get('parentId'),
      ...additionalProps,
    });
  }

  setViewportDimensions() {
    if (this.appRef) {
      const { width, height } = this.appRef.getBoundingClientRect();
      this.props.dispatch(setViewportDimensions(width, height));
    }
  }

  saveAppRef(ref) {
    this.appRef = ref;
  }

  filterTopology(activeFilter) {
    let activeContainers = [];
    if (activeFilter.name === 'critical' && this.props.nodeSeverity) {
      for (let container in this.props.nodeSeverity) {
        if (this.props.nodeSeverity[container] == 'critical') {
          activeContainers.push(container);
        }
      }
    } else if (activeFilter.name === 'high' && this.props.nodeSeverity) {
      for (let container in this.props.nodeSeverity) {
        if (this.props.nodeSeverity[container] == 'high') {
          activeContainers.push(container);
        }
      }
    } else if (activeFilter.name === 'medium' && this.props.nodeSeverity) {
      for (let container in this.props.nodeSeverity) {
        if (this.props.nodeSeverity[container] == 'medium') {
          activeContainers.push(container);
        }
      }
    } else if (activeFilter.name === 'low' && this.props.nodeSeverity) {
      for (let container in this.props.nodeSeverity) {
        if (this.props.nodeSeverity[container] == 'low') {
          activeContainers.push(container);
        }
      }
    } else if (activeFilter.name === 'all_containers' && this.props.nodeSeverity) {
      for (let container in this.props.nodeSeverity) {
        activeContainers.push(container);
      }
    }
    this.props.dispatch(updateTopologyFilter(activeContainers));
  }

  render() {
    const { showingDetails, showingTimeTravel, isDonutDetailsModalVisible } = this.props;
    const className = classNames('scope-app', { 'time-travel-open': showingTimeTravel });
    const allContainer = {name: 'all_containers'};

    return (
      <div>
        <SideNavigation navMenuCollection={this.sideNavMenuCollection} activeMenu={this.state.activeMenu} />
        <div className={`scope-ui-wrapper ${this.props.isSideNavCollapsed ? 'collapse-side-nav' : 'expand-side-nav'}`}>
          <div className={className} ref={this.saveAppRef}>
            <div className="modals-wrapper">
              {showingDetails && <Details />}
              {isDonutDetailsModalVisible && <DonutDetailsModal />}
            </div>
            <div className="header">
              <div className="selectors">
                <Topologies />
                <div className="topology-filter-wrapper" style={{pointerEvents: 'visible', zIndex: '1'}}>
                  {(this.state.availableSeverityOption) &&
                  <TopologyFilterDropDown list={this.state.availableSeverityOption}
                                          selected={allContainer}
                                          onFilterTopologyCallback={(value) => this.filterTopology(value)} />
                  }
                </div>
              </div>
              <div className="scope-ui-controls-wrapper">
                <ViewModeSelector />
                <TimeControl />
              </div>
            </div>
            <Nodes />
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentTopology: state.get('currentTopology'),
    currentTopologyId: state.get('currentTopologyId'),
    isResourceViewMode: isResourceViewModeSelector(state),
    isTableViewMode: isTableViewModeSelector(state),
    isGraphViewMode: isGraphViewModeSelector(state),
    pinnedMetricType: state.get('pinnedMetricType'),
    routeSet: state.get('routeSet'),
    searchFocused: state.get('searchFocused'),
    searchQuery: state.get('searchQuery'),
    showingDetails: state.get('nodeDetails').size > 0,
    showingHelp: state.get('showingHelp'),
    showingTimeTravel: state.get('showingTimeTravel'),
    showingTroubleshootingMenu: state.get('showingTroubleshootingMenu'),
    showingNetworkSelector: availableNetworksSelector(state).count() > 0,
    showingTerminal: state.get('controlPipes').size > 0,
    topologyViewMode: state.get('topologyViewMode'),
    urlState: getUrlState(state),
    isDonutDetailsModalVisible: state.get('isDonutDetailsModalVisible'),
    isSideNavCollapsed: state.get('isSideNavCollapsed'),
    nodeSeverity: state.get('nodeSeverity')
  };
}

export default connect(
  mapStateToProps
)(ScopeView);
