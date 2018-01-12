/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
import SideNavMenu from '../side-nav-menu/side-nav-menu';

// Other imports
import {
  collapseSideNavbar,
  expandSideNavbar, logoutUser
} from "../../../actions/app-actions";
import {
  BRAND_LOGO_WITH_NAME,
  BRAND_LOGO_WITHOUT_NAME
} from "../../../constants/img-urls";

class SideNavigation extends React.Component {

  toggleSideNavView() {
    const isSideNavCollapsed = this.props.isSideNavCollapsed;
    if (isSideNavCollapsed) {
      this.props.dispatch(expandSideNavbar());
    } else {
      this.props.dispatch(collapseSideNavbar());
    }
  }

  logout() {
    this.props.dispatch(logoutUser());
  }

  render() {
    const navMenus = this.props.navMenuCollection;
    return (
      <div className={`side-navigation-wrapper ${this.props.isSideNavCollapsed ? 'collapsed-side-nav' : 'expanded-side-nav'}`}>
        <div className="brand-logo-wrapper">
          <img src={this.props.isSideNavCollapsed ? BRAND_LOGO_WITHOUT_NAME : BRAND_LOGO_WITH_NAME} alt="DeepFence Logo" className="brand-logo" />
        </div>
        <div className="navigation-menu-wrapper">
          {navMenus.map(function (menu) {
            return ( <SideNavMenu key={menu.name} data={menu} link={menu.link}/> );
          }.bind(this))}
        </div>
        <div className="logout-btn-wrapper">
          <div className="logout-btn-container" onClick={() => this.logout()}>
            <i className="fa fa-sign-out" aria-hidden="true"></i>
          </div>
        </div>
        <div className="collapse-expand-btn-wrapper">
          <div className="collapse-btn-container" onClick={()=> this.toggleSideNavView()}>
            <i className={`fa ${this.props.isSideNavCollapsed ? "fa-angle-double-right" : "fa-angle-double-left"}`} aria-hidden="true" style={{color: "grey"}}></i>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isSideNavCollapsed: state.get('isSideNavCollapsed'),
    isNavbarActive: state.get('isNavbarActive')
  };
}

export default connect(
  mapStateToProps
)(SideNavigation);
