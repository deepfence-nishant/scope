/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
import SideNavigation from '../common/side-navigation/side-navigation';
import HeaderView from '../common/header-view/header-view';
import TopStatsPanelView from '../common/top-stats-panel-view/top-stats-panel-view';
import NotificationToaster from '../common/notification-toaster/notification-toaster';
import AlertsViewSwitcher from './alerts-view-switcher/alerts-view-switcher';
import AlertTableView from './alert-table-view/alert-table-view';
import LicenseExpiredModalView from '../common/license-expired-modal-view/license-expired-modal-view';

import {
  IS_NOTIFICATION_CHECK_ENABLE,
  NOTIFICATION_POLLING_DURATION
} from '../../constants/visualization-config';

import {
  fetchLicenseStatus,
  pollNotification
} from '../../actions/app-actions';

class AlertView extends React.Component {
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
    this.state = {activeMenu: this.sideNavMenuCollection[0]};
  }

  componentDidMount() {

    this.fetchNotifications();
    this.pollLicenseStatus();

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

  componentWillReceiveProps(newProps){
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

  render() {
    const { isLicenseExpiryModalVisible } = this.state;
    
    const { isToasterVisible } = this.props;

    return (
      <div>
        <SideNavigation navMenuCollection={this.sideNavMenuCollection} activeMenu={this.state.activeMenu} />
        <div className="alert-view-wrapper">
          <HeaderView />

          <TopStatsPanelView />

          <AlertsViewSwitcher />

          <AlertTableView />
        </div>

        { isLicenseExpiryModalVisible &&  <LicenseExpiredModalView /> }

        { isToasterVisible && <NotificationToaster /> }
      </div>
    );
  }
};

function mapStateToProps(state) {
  return {
    hosts: state.get('hosts'),
    isToasterVisible: state.get('isToasterVisible'),
    isSuccess: state.get('isSuccess'),
    isError: state.get('isError'),
    licenseResponse: state.get('licenseResponse'),
  };
}
export default connect(
  mapStateToProps
)(AlertView);