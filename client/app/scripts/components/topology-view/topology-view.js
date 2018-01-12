/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
import HeaderView from '../common/header-view/header-view';
import TopStatsPanelView from '../common/top-stats-panel-view/top-stats-panel-view';
import ScopeView from '../common/scope-view/scope-view';
import LicenseExpiredModalView from '../common/license-expired-modal-view/license-expired-modal-view';
import NotificationToaster from '../common/notification-toaster/notification-toaster';

import {fetchLicenseStatus, pollNotification, setActiveFilters} from '../../actions/app-actions';
import {
  IS_NOTIFICATION_CHECK_ENABLE, NOTIFICATION_POLLING_DURATION
} from '../../constants/visualization-config';

class TopologyView extends React.Component {
  constructor() {
    super();
    this.state = {};
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
    this.props.dispatch(setActiveFilters(undefined, undefined));
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
      <div className="topology-view-wrapper">
        <HeaderView />

        <TopStatsPanelView />

        <ScopeView />

        { isLicenseExpiryModalVisible && <LicenseExpiredModalView /> }

        { isToasterVisible && <NotificationToaster /> }
      </div>
    );
  }

}

function mapStateToProps(state) {
  return {
    nodes: state.get('nodes'),
    hosts: state.get('hosts'),
    topologyId: state.get('currentTopologyId'),
    isToasterVisible: state.get('isToasterVisible'),
    isSuccess: state.get('isSuccess'),
    isError: state.get('isError'),
    licenseResponse: state.get('licenseResponse'),
  };
}
export default connect(
  mapStateToProps
)(TopologyView);
