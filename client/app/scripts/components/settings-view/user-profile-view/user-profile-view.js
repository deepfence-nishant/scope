/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
import ChangePasswordView from './change-password-view';
import InviteView from './invite-view';

import {
  fetchUserProfile
} from '../../../actions/app-actions';
import {EMPTY_STATE_TEXT} from "../../../constants/naming";

class UserProfileView extends React.Component {
  constructor() {
    super();
    this.state = {
      isUserProfileFlow: false,
      isChangePasswordFlow: false,
      isInviteFlow: false
    };
  }

  componentDidMount() {
    this.props.dispatch(fetchUserProfile());
    this.toggleView('profileView');
  }

  componentWillReceiveProps(newProps) {
    if (newProps.userProfile) {
      this.setState({
        userProfile: newProps.userProfile || this.props.userProfile
      });
    }
  }

  toggleView(view) {
    if (view == 'profileView') {
      this.setState({
        isUserProfileFlow: true,
        isChangePasswordFlow: false,
        isInviteFlow: false
      });
    } else if (view == 'changePasswordFlow') {
      this.setState({
        isUserProfileFlow: false,
        isChangePasswordFlow: true,
        isInviteFlow: false
      });
    } else if (view == 'inviteFlow') {
      this.setState({
        isUserProfileFlow: false,
        isChangePasswordFlow: false,
        isInviteFlow: true
      });
    }
  }

  getUserProfileView() {
    const redColor = {
	      color: '#db2547'
	    };
    return (
      <div className="user-details-wrapper">
        <div className="col-sm-6 col-md-6 col-lg-6" style={{border: '1px solid #252525'}}>
          <div className="user-details-row">
            <div className="user-details-key">First name</div>
            <div className="user-details-value">{this.state.userProfile.first_name}</div>
          </div>
          <div className="user-details-row">
            <div className="user-details-key">Last name</div>
            <div className="user-details-value">{this.state.userProfile.last_name}</div>
          </div>
          <div className="user-details-row">
            <div className="user-details-key">Email</div>
            <div className="user-details-value">{this.state.userProfile.email}</div>
          </div>
          <div className="user-details-row">
            <div className="user-details-key">Company</div>
            <div className="user-details-value">{this.state.userProfile.company}</div>
          </div>
          <div className="user-details-row">
            <div className="user-details-key">Role</div>
            <div className="user-details-value">{this.state.userProfile.role}</div>
          </div>
          <div className="user-details-row">
            <div className="user-details-key">License Key</div>
            <div className="user-details-value">{this.state.userProfile.license_key}</div>
          </div>
         <div className="user-details-row">
           <div className="user-details-key">License Type</div>
           <div className="user-details-value">{this.state.userProfile.license_type}</div>
         </div>
         <div className="user-details-row" style={redColor}>
           <div className="user-details-key">End Date</div>
           <div className="user-details-value">{this.state.userProfile.end_date}</div>
         </div>
         <div className="user-details-row">
           <div className="user-details-key">No Of Hosts</div>
           <div className="user-details-value">{this.state.userProfile.no_of_hosts}</div>
         </div>
        </div>
      </div>
    );
  }

  getProfileView() {
    return(
      <div className="user-profile-view-wrapper">
        <div className="profile-container">
          <div className="btn-container">
            <div className="col-md-6 col-lg-6 no-padding">
              <div className="btn-wrapper" style={{justifyContent: 'left'}}>
                { !this.state.isUserProfileFlow && <div className="go-back-btn" onClick={()=> this.toggleView('profileView')}>
                  <i className="fa fa-arrow-left" aria-hidden="true"></i> <span style={{paddingLeft: '5px'}}> Go Back</span>
                </div>}
              </div>
            </div>
            <div className="col-md-6 col-lg-6 no-padding">
              <div className="btn-wrapper">
                <div className="u-m-btn" onClick={()=> this.toggleView('changePasswordFlow')}>Change Password</div>
                {this.state.userProfile.role == 'admin' && <div className="u-m-btn" onClick={()=> this.toggleView('inviteFlow')}>Send Invite</div>}
              </div>
            </div>
          </div>

          { this.state.isUserProfileFlow && this.getUserProfileView() }

          { this.state.isChangePasswordFlow && <ChangePasswordView /> }

          { this.state.isInviteFlow && <InviteView /> }

        </div>
      </div>
    );
  }

  getEmptyState() {
    const emptyStateWrapper = {
      height: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };
    return(
      <div style={emptyStateWrapper}>
        <div className='empty-state-text'>{ EMPTY_STATE_TEXT }</div>
      </div>
    );
  }

  checkDataAvailabilityStatus(data) {
    let isAvailable;
    if (typeof data == 'object') {
      isAvailable = true;
    } else {
      isAvailable = false;
    }
    return isAvailable;
  }

  render() {
    return (
      <div>
        { this.checkDataAvailabilityStatus(this.state.userProfile) ? this.getProfileView() : this.getEmptyState() }
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    userProfile: state.get('userProfile')
  };
}

export default connect(
  mapStateToProps
)(UserProfileView);
