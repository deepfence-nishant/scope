/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
import SideNavigation from '../common/side-navigation/side-navigation';
import LicenseExpiredModalView from '../common/license-expired-modal-view/license-expired-modal-view';

import {
  fetchLicenseStatus,
  fetchRunningContainerCount, fetchRunningHostCount, fetchSystemStatus, markNotificationAsSeen, pollNotification
} from '../../actions/app-actions';
import {IS_NOTIFICATION_CHECK_ENABLE, NOTIFICATION_POLLING_DURATION} from "../../constants/visualization-config";
import {removeUnderscore} from "../../utils/string-utils";

const alertColor = {
  color: '#db2547'
}

class NotificationsView extends React.Component {
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

    // API CALL TO GET CONTAINER AND HOST COUNT FROM SCOPE.
    this.props.dispatch(fetchRunningContainerCount());
    this.props.dispatch(fetchRunningHostCount());

    this.fetchNotifications();
    this.pollLicenseStatus();
    this.getSystemStatus();

    if(IS_NOTIFICATION_CHECK_ENABLE){
      let interval = setInterval(()=>{
        // Notification polling
        this.fetchNotifications();
        // License polling
        this.pollLicenseStatus();
      }, NOTIFICATION_POLLING_DURATION * 1000);
      this.setState({intervalObj : interval});
    }

    if (this.props.notificationsResponse) {
      this.updateNotifications(this.props.notificationsResponse);
    }
  }

  componentWillReceiveProps(newProps) {
    if (newProps.notificationsResponse) {
      this.updateNotifications(newProps.notificationsResponse);
    }
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
    this.updateNotificationSeenStatus();
    if(this.state.intervalObj){
      clearInterval(this.state.intervalObj);
    }
  }

  updateNotificationSeenStatus() {
    this.props.dispatch(markNotificationAsSeen());
  }

  fetchNotifications() {
    let params = {
      xHostCount: this.props.hosts ? this.props.hosts.hostsCount : 0
    };
    this.props.dispatch(pollNotification(params));
  }

  getSystemStatus() {
    this.props.dispatch(fetchSystemStatus());
  }

  pollLicenseStatus() {
    this.props.dispatch(fetchLicenseStatus());
  }

  updateNotifications(notifications) {
    this.setState({
      notificationsData: notifications
    })
  }

  getNotificationsLeftpanelView() {
    const {
      hosts=0,
      containers=0
    } = this.props;
    const {
      notificationsData,
    } = this.state;
    const esHealthStatus = {
      width: '10px',
      height: '10px',
      backgroundColor: notificationsData ? notificationsData.elasticsearch_cluster_health.status : 'grey',
      borderRadius: '50%',
      marginLeft: '10px'
    };
    return (
      <div className='notifications-wrapper'>
        <div className="notification-details-wrapper">
          <div className="notification-details-row">
            <div className="notification-details-key">Tracking hosts</div>
            <div className="notification-details-value  low-severity">
              {hosts.hostsCount} out of {notificationsData.no_of_hosts}
            </div>
          </div>
          <div className="notification-details-row">
            <div className="notification-details-key">Tracking containers</div>
            <div className="notification-details-value">{containers.containerCount}</div>
          </div>
          <div className="notification-details-row" style={alertColor}>
            <div className="notification-details-key">License expiry date</div>
            <div className="notification-details-value">
              {notificationsData.license_expiry_date}
            </div>
          </div>
          <div className="notification-details-row">
            <div className="notification-details-key">Elasticsearch health</div>
            <div className="notification-details-value">
              <div style={esHealthStatus}></div>
            </div>
          </div>
          <div className="notification-details-row">
            <div className="notification-details-key">Number of docs</div>
            <div className="notification-details-value">
              {notificationsData.elasticsearch_cluster_health.number_of_docs}
            </div>
          </div>
        </div>
      </div>
    );
  }

  getNotificationRightPanelView() {
    const {
      notificationsData,
    } = this.state;


    var styles = {
		color:'red',
		margin:'12 em',
		fontWeight:'bold'
	};


    return (
      <div>
        <div className='system-status-wrapper'>
          {/*<div className={`${(notificationsData.critical_alerts > 0) ? 'alert-detected-styles' : 'alert-not-detected-styles' }`}> */}
          <div className='system-status-heading'>
		Detected <span  style={{color: notificationsData.critical_alerts > 0 ? '#db2547' : '#999999' }} >
			{notificationsData.critical_alerts}
		</span> critical alerts.
          </div>
        </div>
      </div>
    );
  }

  getTableView(table) {
    const { systemStatusDetails } = this.props;
    const tableDetails = systemStatusDetails[table]
    const tableKeys = Object.keys(tableDetails);
    return (
      <div className='table-view-wrapper col-md-12 col-lg-12' key={table}>
        <div className='table-heading'>{table} status</div>
        <div className='table-wrapper'>
          { tableKeys && tableKeys.map(tableKey=> this.getTableKeyValuePairView(tableKey, tableDetails) ) }
        </div>
      </div>
    )
  }

  getTableKeyValuePairView(tableKey, tableDetails){
    return (
      <div key={tableKey} className='table-column'>
        <div className='table-key'>{ removeUnderscore(tableKey) }</div>
        <div className='key-value  medium-severity'>{ tableDetails[tableKey] }</div>
      </div>
    )
  }

  getEmptyState() {
    const loaderContainerStyles = {
      height: '100px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '75%',
      height: '100%'
    }
    return (
      <div style={loaderContainerStyles}>
        <div className="lds-dual-ring">
          <div />
        </div>
      </div>
    )
  }

  render() {
    const { notificationsData, isLicenseExpiryModalVisible } = this.state;
    const { systemStatusDetails } = this.props;
    if (systemStatusDetails) {
      var availableTables = Object.keys(systemStatusDetails);
    }

    return (
      <div>
        <SideNavigation navMenuCollection={this.sideNavMenuCollection} activeMenu={this.state.activeMenu} />

        <div className="notifications-view-wrapper">
          <div className={`notifications-container ${this.props.isSideNavCollapsed ? 'collapse-side-nav' : 'expand-side-nav'}`}>


          <div className='col-md-6 col-lg-6'>

			{ notificationsData && this.getNotificationRightPanelView() }

          </div>









            <div style={{display: 'flex'}}>
              <div className='col-md-6 col-lg-6'>
                { notificationsData && this.getNotificationsLeftpanelView() }
              </div>




            </div>

            <div className='system-status-wrapper'>
              <div className='system-status-heading'>System Status</div>
              { systemStatusDetails ? availableTables.map(table=> this.getTableView(table)) : this.getEmptyState() }
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
    notificationsResponse: state.get('notificationsResponse'),
    containers: state.get('containers'),
    hosts: state.get('hosts'),
    systemStatusDetails: state.get('systemStatusDetails'),
    isSuccess: state.get('isSuccess'),
    isError: state.get('isError'),
    licenseResponse: state.get('licenseResponse')
  };
}

export default connect(
  mapStateToProps
)(NotificationsView);
