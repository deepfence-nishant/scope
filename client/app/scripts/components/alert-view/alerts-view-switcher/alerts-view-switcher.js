/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
import AllTypeTabView from "./all-type-tab-view/all-type-tab-view";
import ThreatMapTabView from "./threat-map-tab-view/threat-map-tab-view";
import GeoMapTabView from "./geo-map-tab-view/geo-map-tab-view";
import DonutTabView from "./donut-tab-view/donut-tab-view";

// Util imports
import { removeUnderscore } from '../../../utils/string-utils';

class AlertsViewSwitcher extends React.Component {
  constructor(props) {
    super(props);
    this.tabList = [
      {name: 'summary', isActive: true},
      {name: 'threat_map', isActive: false},
      {name: 'geo_map', isActive: false},
      {name: 'all_type', isActive: false}
    ];
    this.state = {
      activeTab: this.tabList[0]
    };
    this.handleOnClick = this.handleOnClick.bind(this);
  }

  handleOnClick(tab) {
    this.setState({activeTab: tab});
  }

  renderTabsList() {
    const tabs = [];
    for (let tab = 0; tab < this.tabList.length; tab++) {
      let tabDetails = this.tabList[tab];
      const activeClass = tabDetails.name === this.state.activeTab.name ? "active-tab" : "";
      tabs.push(
        <div className={"tab-container " + activeClass}
             key={tab} onClick={()=> this.handleOnClick(tabDetails)}>
          <div className="tab">{removeUnderscore(tabDetails.name)}</div>
        </div>
      );
    }
    return tabs;
  }

  renderActiveTabContent() {
    const activeTab  = this.state.activeTab;
    switch (activeTab.name) {
      case 'all_type': {
        return <AllTypeTabView />
      }
      case 'threat_map': {
        return <ThreatMapTabView />
      }
      case 'geo_map': {
        return <GeoMapTabView />
      }
      case 'summary': {
        return <DonutTabView />
      }
      default: {
        null;
      }
    }
  }

  render() {
    return (
      <div className={`alerts-view-switcher-wrapper ${this.props.isSideNavCollapsed ? 'collapse-side-nav' : 'expand-side-nav'}`}>
        <div className="tabs-wrapper">
          {this.renderTabsList()}
        </div>
        <div className="tabs-content-wrapper">
          {this.renderActiveTabContent()}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isSideNavCollapsed: state.get('isSideNavCollapsed')
  };
}

export default connect(
  mapStateToProps
)(AlertsViewSwitcher);