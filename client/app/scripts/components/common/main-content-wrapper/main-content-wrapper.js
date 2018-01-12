/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom components imports
import HomeView from '../../home-view/home-view';
import TopologyView from '../../topology-view/topology-view';
import AlertView from '../../alert-view/alert-view';
import VulnerabilityView from '../../vulnerability-view/vulnerability-view';
import SettingsView from '../../settings-view/settings-view';
import NotificationsView from '../../notification-view/notification-view';
import UserProfileView from '../../settings-view/user-profile-view/user-profile-view';

import SideNavigation from '../side-navigation/side-navigation';

class MainContentWrapper extends React.Component {
  constructor() {
    super();
    this.sideNavMenuCollection = [
      { name: 'topology', menuIcon: 'icon-Topology', isActive: true, link: '/topology' },
      { name: 'alert', menuIcon: 'icon-alert', isActive: false, link: '/alert' },
      { name: 'vulnerabilities', menuIcon: 'icon-Vulnerabilities', isActive: false, link: '/vulnerability' },
      { name: 'settings', menuIcon: 'icon-settings', isActive: false, link: '/settings' },
      { name: 'notification', menuIcon: 'icon-notification', isActive: false, link: '/notification' },
      { name: 'profile', menuIcon: 'fa fa-user-circle-o', isActive: false, link: '/profile' }
    ];
    this.state = {
      activeMenu: this.sideNavMenuCollection[0]
    };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {}

  render() {
    return(
      <SideNavigation navMenuCollection={this.sideNavMenuCollection} activeMenu={this.state.activeMenu} changeMenu={this.handleClick} />
    )
  }
  /*render() {
    return (
      <div className="main-content-wrapper">
        {this.props.activeTab.name === 'home' ?
          <HomeView /> : null
        }
        {this.props.activeTab.name === 'topology' ?
          <TopologyView /> : null
        }
        {this.props.activeTab.name === 'alert' ?
          <AlertView /> : null
        }
        {this.props.activeTab.name === 'vulnerabilities' ?
          <VulnerabilityView /> : null
        }
        {this.props.activeTab.name === 'settings' ?
          <SettingsView /> : null
        }
        {this.props.activeTab.name === 'notification' ?
          <NotificationsView /> : null
        }
        {this.props.activeTab.name === 'user name' ?
          <UserProfileView /> : null
        }
      </div>
    );
  }*/
}

function mapStateToProps() {
  return {};
}

export default connect(
  mapStateToProps
)(MainContentWrapper);
