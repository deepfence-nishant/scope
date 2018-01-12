/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
import SideNavigation from '../common/side-navigation/side-navigation';
import EmailIntegrationView from './email-integration-view/email-integration-view';
import SlackIntegrationView from './slack-integration-view/slack-integration-view';
import PagerDutyIntegrationView from './pager-duty-integration-view/pager-duty-integration-view';
import HipChatIntegrationView from './hipchat-integration-view/hipchat-integration-view';
import LicenseExpiredModalView from '../common/license-expired-modal-view/license-expired-modal-view';

import {
  fetchLicenseStatus, fetchRunningHostCount,
  pollNotification
} from '../../actions/app-actions';
import {
  IS_NOTIFICATION_CHECK_ENABLE,
  NOTIFICATION_POLLING_DURATION
} from '../../constants/visualization-config';

class IntegrationView extends React.Component {
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
    this.tabList = [
      {
        name: 'email',
        isActive: true,
        icon: 'http://res.cloudinary.com/dmwvws7yf/image/upload/v1513507155/email-icon_vpeq8g.png'
      },
      {
        name: 'slack',
        isActive: false,
        icon: 'http://res.cloudinary.com/dmwvws7yf/image/upload/v1513507198/slack_muqvtj.png'
      },
      {
        name: 'pager_duty',
        isActive: false,
        icon: 'http://res.cloudinary.com/dmwvws7yf/image/upload/v1513507124/32606-ccb977f6d323e8bfb5128df59457ac0b-medium_jpg_zlx9us.jpg'
      },
      {
        name: 'hip_chat',
        isActive: false,
        icon: 'http://res.cloudinary.com/dmwvws7yf/image/upload/v1513507168/hipchat_opp3jq.png'
      }
    ];
    this.state = {
      activeMenu: this.sideNavMenuCollection[0],
      activeTab: this.tabList[0]
    };
    this.handleOnClick = this.handleOnClick.bind(this);
  }

  componentDidMount() {

    this.fetchNotifications();

    this.pollLicenseStatus();

    this.fetchRunningHostsCount();

    if(IS_NOTIFICATION_CHECK_ENABLE){
      let interval = setInterval(()=>{
        // Notification polling
        this.fetchNotifications();
        // License polling
        this.pollLicenseStatus();
      }, NOTIFICATION_POLLING_DURATION * 1000);
      this.setState({intervalObj : interval});
    }
  }

  componentWillUnmount() {
    if(this.state.intervalObj){
      clearInterval(this.state.intervalObj);
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
    const imgIcon = {
      width: '30px',
      height: '30px'
    }
    const tabs = [];
    for (let tab = 0; tab < this.tabList.length; tab++) {
      let tabDetails = this.tabList[tab];
      const activeClass = tabDetails.name === this.state.activeTab.name ? "active-tab" : "";
      tabs.push(
        <div className={"tab-container " + activeClass} key={tab} onClick={()=> this.handleOnClick(tabDetails)}>
          <div className="tab">
            <img style={imgIcon} src={tabDetails.icon} />
          </div>
        </div>
      );
    }
    return tabs;
  }

  renderActiveTabContent() {
    const activeTab  = this.state.activeTab;
    switch (activeTab.name) {
      case 'email': {
        return <EmailIntegrationView />
      }
      case 'slack': {
        return <SlackIntegrationView />
      }
      case 'pager_duty': {
        return <PagerDutyIntegrationView />
      }
      case 'hip_chat': {
        return <HipChatIntegrationView />
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

        <div className={`integration-view-wrapper ${this.props.isSideNavCollapsed ? 'collapse-side-nav' : 'expand-side-nav'}`}>
          <div className="integration-container">

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
)(IntegrationView);
