/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';
import { Link, NavLink } from 'react-router-dom';
import {disableNotificationIcon, enableNotificationIcon} from "../../../actions/app-actions";

class SideNavMenu extends React.Component {

  constructor() {
    super();
    this.state = {}
  }

  componentDidMount() {
    const licenseStatus = localStorage.getItem('licenseStatus');
    this.toggleNavbarState(licenseStatus == 'true');
  }

  componentWillReceiveProps(newProps) {
    if (this.props.isNavbarActive != newProps.isNavbarActive) {
      this.toggleNavbarState(newProps.isNavbarActive);
    }
    if (newProps.notificationsResponse && (newProps.notificationsResponse.critical_alerts > 0)) {
      this.props.dispatch(enableNotificationIcon());
    } else {
      this.props.dispatch(disableNotificationIcon());
    }
  }

  toggleNavbarState(navbarState) {
    this.setState({
      isNavbarActive: navbarState
    });
  }

  render() {
    const showLabel = {
      display: 'block'
    };
    const hideLabel = {
      display: 'none'
    };
    const iconWrapperStyles = {
      display: 'flex'
    };
    const notificationDotStyles = {
      width: '5px',
      height: '5px',
      borderRadius: '50%',
      backgroundColor: '#00a9ff'
    };
    if (this.state.isNavbarActive) {
      return (
        <NavLink className='navigation-menu'  activeClassName="active" to={this.props.link} >
          <div className="menu-icon" style={iconWrapperStyles}>
            <i className={this.props.data.menuIcon} aria-hidden="true" />
            {(this.props.data.name == 'notification' && this.props.isNotificationIconEnable) && <span style={notificationDotStyles}></span>}
          </div>
          <div className="menu-name" style={this.props.isSideNavCollapsed ? hideLabel : showLabel}>
            {this.props.data.name}
          </div>
        </NavLink>
      );
    } else {
      return (
        <Link className={`navigation-menu ${(this.props.data.name == 'settings') ? 'active' : 'disable'}`} to={this.props.link} >
          <div className="menu-icon">
            <i className={this.props.data.menuIcon} aria-hidden="true" />
          </div>
          <div className="menu-name" style={this.props.isSideNavCollapsed ? hideLabel : showLabel}>
            {this.props.data.name}
          </div>
        </Link>
      );
    }
  }
}

function mapStateToProps(state) {
  return {
    notificationsResponse: state.get('notificationsResponse'),
    isNotificationIconEnable: state.get('isNotificationIconEnable'),
    isSideNavCollapsed: state.get('isSideNavCollapsed'),
    isNavbarActive: state.get('isNavbarActive')
  };
}

export default connect(
  mapStateToProps
)(SideNavMenu);
