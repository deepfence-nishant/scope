/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
import SideNavigation from '../common/side-navigation/side-navigation';
import UserProfileView from './user-profile-view/user-profile-view';
import AlertsManagementView from './alerts-management/alerts-management';
import LicenseExpiredModalView from '../common/license-expired-modal-view/license-expired-modal-view';

import { removeUnderscore } from "../../utils/string-utils";
import { IS_NOTIFICATION_CHECK_ENABLE, NOTIFICATION_POLLING_DURATION } from "../../constants/visualization-config";
import {fetchLicenseStatus, fetchRunningHostCount, pollNotification} from "../../actions/app-actions";
import {getUserRole, isCompanyLicenseActive} from "../../helpers/auth-helper";

class SettingsView extends React.Component {
  constructor() {
    super();
    this.sideNavMenuCollection = [
      { name: 'topology', menuIcon: 'icon-Topology', isActive: true, link: '/topology' },
      { name: 'alert', menuIcon: 'icon-alert', isActive: false, link: '/alert' },
      { name: 'vulnerabilities', menuIcon: 'icon-biohazard', isActive: false, link: '/vulnerability' },
      { name: 'notification', menuIcon: 'icon-notification', isActive: false, link: '/notification' },
      { name: 'integrations', menuIcon: 'icon-webhook', isActive: false, link: '/integration' },
      { name: 'settings', menuIcon: 'icon-settings', isActive: false, link: '/settings' },
    ];
    this.adminTabList = [
      {name: 'user_management', isActive: false},
      {name: 'alert_management', isActive: false}
    ];
    this.userTabList = [
      {name: 'user_management', isActive: false}
    ];
    this.state = {
      activeMenu: this.sideNavMenuCollection[0],
      activeTab: this.adminTabList[0]
    };
    this.handleOnClick = this.handleOnClick.bind(this);
  }

  componentDidMount() {
    parent.location.hash = 'settings';

    this.pollLicenseStatus();

    this.fetchRunningHostsCount();

    if (isCompanyLicenseActive()) {

      this.fetchNotifications();

      if(IS_NOTIFICATION_CHECK_ENABLE) {
        let interval = setInterval(()=>{
          // Notification polling
          this.fetchNotifications();
          // License polling
          this.pollLicenseStatus();
        }, NOTIFICATION_POLLING_DURATION * 1000);
        this.setState({intervalObj : interval});
      }
    }
  }

  componentWillReceiveProps(newProps) {
    if ((newProps.isSuccess && !newProps.isError) && newProps.licenseResponse.license_status == 'expired') {
      this.setState({
        licenseResponse: newProps.licenseResponse,
        isLicenseExpiryModalVisible: true
      });
    } else {
      this.setState({
        isLicenseExpiryModalVisible: false
      });
    }
  }

  componentWillUnmount(){
    if(this.state.intervalObj){
      clearInterval(this.state.intervalObj);
    }
  }

  fetchNotifications() {
    let params = {
      xHostCount: this.props.hosts ? this.props.hosts.hostsCount : 0
    };
    this.props.dispatch(pollNotification(params));
  }

  pollLicenseStatus() {
    this.props.dispatch(fetchLicenseStatus());
  }

  fetchRunningHostsCount() {
    this.props.dispatch(fetchRunningHostCount());
  }

  handleOnClick(tab) {
    this.setState({activeTab: tab});
  }

  renderTabsList() {
    const tabs = [];
    let tabList;
    if (getUserRole() == 'admin') {
      tabList = this.adminTabList;
    } else {
      tabList = this.userTabList;
    }
    for (let tab = 0; tab < tabList.length; tab++) {
      let tabDetails = tabList[tab];
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
      case 'user_management': {
        return <UserProfileView />
      }
      case 'alert_management': {
        return <AlertsManagementView />
      }
      default: {
        null;
      }
    }
  }

  render() {
    const { isLicenseExpiryModalVisible } = this.state;

    return (
      <div>

        <SideNavigation navMenuCollection={this.sideNavMenuCollection} activeMenu={this.state.activeMenu} />

        <div className={`settings-view-wrapper ${this.props.isSideNavCollapsed ? 'collapse-side-nav' : 'expand-side-nav'}`}>
          <div className="settings-container">
            <div className="tabs-wrapper">
              {this.renderTabsList()}
            </div>
            <div className="tabs-content-wrapper">
              {this.renderActiveTabContent()}
            </div>
          </div>
        </div>

        { isLicenseExpiryModalVisible &&  <LicenseExpiredModalView /> }

      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isSideNavCollapsed: state.get('isSideNavCollapsed'),
    hosts: state.get('hosts'),
    isSuccess: state.get('isSuccess'),
    isError: state.get('isError'),
    licenseResponse: state.get('licenseResponse')
  };
}

export default connect(
  mapStateToProps
)(SettingsView);
