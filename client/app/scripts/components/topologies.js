import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';

import { trackMixpanelEvent } from '../utils/tracking-utils';
import { searchMatchCountByTopologySelector } from '../selectors/search';
import { isResourceViewModeSelector } from '../selectors/topology';
import { clickTopology } from '../actions/app-actions';

/* START :: METHOD TO GET NODE AND CONNECTION COUNT WRAPPER */
function getTopologyInfo(topology) {
  const nodesCount = topology.getIn(['stats', 'node_count']);
  const connectionsCount = topology.getIn(['stats', 'edge_count']);

  return (
    <div className="topology-info-wrapper" style={{display: 'flex'}}>
      <div className="nodes-info">
        <span className="info-title">Nodes </span>
        <span className="info-data">{nodesCount}</span>
      </div>
      |
      <div className="connections-info">
        <span className="info-title">Connections </span>
        <span className="info-data">{connectionsCount}</span>
      </div>
    </div>
  );
}
/* END :: METHOD TO GET NODE AND CONNECTION COUNT WRAPPER */

class Topologies extends React.Component {

  constructor(props, context) {
    super(props, context);
    this.onTopologyClick = this.onTopologyClick.bind(this);
  }

  onTopologyClick(ev, topology) {
    ev.preventDefault();
    trackMixpanelEvent('scope.topology.selector.click', {
      topologyId: topology.get('id'),
      parentTopologyId: topology.get('parentId'),
    });
    this.props.clickTopology(ev.currentTarget.getAttribute('rel'));
  }

  renderSubTopology(subTopology) {
    const topologyId = subTopology.get('id');
    const isActive = subTopology === this.props.currentTopology;
    const searchMatchCount = this.props.searchMatchCountByTopology.get(topologyId) || 0;
    const topologyInfo = getTopologyInfo(subTopology);
    const className = classnames('topologies-sub-item', {
      // Don't show matches in the resource view as searching is not supported there yet.
      'topologies-sub-item-matched': !this.props.isResourceViewMode && searchMatchCount,
      'topologies-sub-item-active': isActive,
    });

    return (
      <div key={topologyId}>
        <div
          className={className} rel={topologyId}
          onClick={ev => this.onTopologyClick(ev, subTopology)}>
          <div className="topologies-sub-item-label">
            {subTopology.get('name')}
          </div>
        </div>
        <div className="active-node-info-wrapper">
          { isActive && <div>{topologyInfo}</div> }
        </div>
      </div>
    );
  }

  renderTopology(topology) {
    const isActive = topology === this.props.currentTopology;
    const searchMatchCount = this.props.searchMatchCountByTopology.get(topology.get('id')) || 0;
    const className = classnames('topologies-item-main', {
      // Don't show matches in the resource view as searching is not supported there yet.
      'topologies-item-main-matched': !this.props.isResourceViewMode && searchMatchCount,
      'topologies-item-main-active': isActive,
    });
    const topologyId = topology.get('id');
    const topologyInfo = getTopologyInfo(topology);
    return (
      <div key={topologyId}>
        <div className="topologies-item">
          <div
            className={className} rel={topologyId}
            onClick={ev => this.onTopologyClick(ev, topology)}>
            <div className="topologies-item-label">
              <span>{topology.get('name')}</span>
              {topology.has('sub_topologies') &&
              <i className="fa fa-caret-down" aria-hidden="true" />}
            </div>
          </div>
          <div className="topologies-sub">
            {topology.has('sub_topologies')
              && topology.get('sub_topologies').map(subTop => this.renderSubTopology(subTop))}
          </div>
        </div>
        <div className="active-node-info-wrapper">
          { isActive && <div>{topologyInfo}</div> }
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className="topologies">
          {this.props.currentTopology && this.props.topologies.map(
            topology => this.renderTopology(topology)
          )}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    topologies: state.get('topologies'),
    currentTopology: state.get('currentTopology'),
    searchMatchCountByTopology: searchMatchCountByTopologySelector(state),
    isResourceViewMode: isResourceViewModeSelector(state),
  };
}

export default connect(
  mapStateToProps,
  { clickTopology }
)(Topologies);
