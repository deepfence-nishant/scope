/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, HashRouter, Switch } from 'react-router-dom';

// Custom components
import TableJSONViewModal from './common/table-json-view-modal/table-json-view-modal';
import EULAView from './common/eula-view/eula-view';

import TopologyView from '../components/topology-view/topology-view';
import AlertView from '../components/alert-view/alert-view';
import VulnerabilityView from '../components/vulnerability-view/vulnerability-view';
import NotificationsView from './notification-view/notification-view';
import IntegrationView from './integration-view/integration-view';
import SettingsView from './settings-view/settings-view';

import LoginView from '../components/auth-module/login-view/login-view';
import RegisterView from '../components/auth-module/register-view/register-view';
import ForgotPasswordView from '../components/auth-module/forgot-password-view/forgot-password-view';
import ResetPasswordView from '../components/auth-module/reset-password-view/reset-password-view';
import RegisterViaInviteView from '../components/auth-module/register-via-invite-view/register-via-invite-view';
import {isCompanyLicenseActive, isUserSessionActive} from '../helpers/auth-helper';

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={(props) => (
    isUserSessionActive() ? <Component {...props} /> : <Redirect to='/login' />
  )} />
);

class DeepFenceApp extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    const { isTableJSONViewModal } = this.props;
    return (
      <div className="dashboard-wrapper">

        <HashRouter>
          <Switch>
            <Route path="/login" render={() => (
              isUserSessionActive() && isCompanyLicenseActive() ? (<Redirect to="/topology"/>) : isCompanyLicenseActive() && !isCompanyLicenseActive() ? <SettingsView/> : (<LoginView />)
            )} />
            <Route path="/register" render={() => (
              isUserSessionActive() && isCompanyLicenseActive() ? (<Redirect to="/topology"/>) : isCompanyLicenseActive() && !isCompanyLicenseActive() ? <SettingsView/> : (<RegisterView />)
            )} />
            <Route path="/forgot-password" render={() => (
              isUserSessionActive() && isCompanyLicenseActive() ? (<Redirect to="/topology"/>) : isCompanyLicenseActive() && !isCompanyLicenseActive() ? <SettingsView/> : (<ForgotPasswordView />)
            )} />
            <Route path="/password-reset" render={() => (
              isUserSessionActive() && isCompanyLicenseActive() ? (<Redirect to="/topology"/>) : isCompanyLicenseActive() && !isCompanyLicenseActive() ? <SettingsView/> : (<ResetPasswordView />)
            )} />
            <Route path="/invite-accept" render={() => (
              isUserSessionActive() && isCompanyLicenseActive() ? (<Redirect to="/topology"/>) : isCompanyLicenseActive() && !isCompanyLicenseActive() ? <SettingsView/> : (<RegisterViaInviteView />)
            )} />
            <Route path="/user-agreement" target='_blank' component={EULAView} />

            <PrivateRoute path="/topology" component={ TopologyView } />
            <PrivateRoute path="/alert" component={ AlertView } />
            <PrivateRoute path="/vulnerability" component={ VulnerabilityView } />
            <PrivateRoute path="/notification" component={ NotificationsView } />
            <PrivateRoute path="/integration" component={ IntegrationView } />
            <PrivateRoute path="/settings" component={ SettingsView } />

            <Route path="*" render={() => (
              isUserSessionActive() ? (<Redirect to="/topology" />) : (<Redirect to="/login" />)
            )} />
          </Switch>
        </HashRouter>

        { isTableJSONViewModal && <TableJSONViewModal /> }

      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isTableJSONViewModal: state.get('isTableJSONViewModal'),
  };
}

export default connect(
  mapStateToProps
)(DeepFenceApp);
