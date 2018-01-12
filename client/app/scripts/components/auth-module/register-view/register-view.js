/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import {registerUser} from '../../../actions/app-actions';

// Custom component imports

class RegisterView extends React.Component {
  constructor() {
    super();
    this.state = {
      firstName: '',
      lastName: '',
      userEmail: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      company: '',
      submitted: false,
      isError: false
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.isError) {
      this.setState({
        responseMsg: newProps.responseMsg,
        isError: newProps.isError
      });
    }
  }

  handleChange(e) {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({ submitted: true });
    const { firstName, lastName, userEmail, password, confirmPassword, phoneNumber, company } = this.state;
    if (firstName && lastName && userEmail && password && confirmPassword && company) {
      let params = {
        first_name: firstName,
        last_name: lastName,
        email: userEmail,
        password: password,
        confirm_password: confirmPassword,
        phone_number: (phoneNumber.length > 0) ? phoneNumber : undefined,
        company: company
      }
      this.props.dispatch(registerUser(params));
    }
  }

  render() {
    const { firstName, lastName, userEmail, password, confirmPassword, phoneNumber, company, submitted } = this.state;
    return (
      <div className="register-view-wrapper">
        <div className="brand-logo-wrapper">
          <img src="http://res.cloudinary.com/dmwvws7yf/image/upload/v1512914400/Deepfence-Logo_piista.png" alt="DeepFence Logo" />
        </div>
        <div className="register-form-wrapper">
          <div className="form-heading">Create new account</div>
          <form name="form" onSubmit={this.handleSubmit}>
            <div className={'form-group' + (submitted && !firstName ? ' has-error' : '')}>
              <label htmlFor="firstName">
                <i className="fa fa-user-o" aria-hidden="true"></i>
                <input type="text" className="form-control" name="firstName" placeholder="First Name" value={firstName} onChange={this.handleChange} />
              </label>
              {submitted && !firstName && <div className="field-error">First name is required</div>}
            </div>
            <div className={'form-group' + (submitted && !lastName ? ' has-error' : '')}>
              <label htmlFor="lastName">
                <i className="fa fa-user-o" aria-hidden="true"></i>
                <input type="text" className="form-control" name="lastName" placeholder="Last Name" value={lastName} onChange={this.handleChange} />
              </label>
              {submitted && !lastName && <div className="field-error">Last name is required</div>}
            </div>
            <div className={'form-group' + (submitted && !userEmail ? ' has-error' : '')}>
              <label htmlFor="email">
                <i className="fa fa-envelope-o" aria-hidden="true"></i>
                <input type="email" className="form-control" name="userEmail" placeholder="Email" value={userEmail} onChange={this.handleChange} />
              </label>
              {submitted && !userEmail && <div className="field-error">Email is required</div>}
            </div>
            <div className={'form-group' + (submitted && !password ? ' has-error' : '')}>
              <label htmlFor="password">
                <i className="fa fa-key" aria-hidden="true"></i>
                <input type="password" className="form-control" name="password" placeholder="Password" value={password} onChange={this.handleChange} />
              </label>
              {submitted && !password && <div className="field-error">Password is required</div>}
            </div>
            <div className={'form-group' + (submitted && !confirmPassword ? ' has-error' : '')}>
              <label htmlFor="confirmPassword">
                <i className="fa fa-key" aria-hidden="true"></i>
                <input type="password" className="form-control" name="confirmPassword" placeholder="Confirm Password" value={confirmPassword} onChange={this.handleChange} />
              </label>
              {submitted && !confirmPassword && <div className="field-error">Retype above password</div>}
            </div>
            <div className='form-group'>
              <label htmlFor="phoneNumber">
                <i className="fa fa-phone" aria-hidden="true"></i>
                <input type="number" className="form-control" name="phoneNumber" placeholder="Phone Number (Optional)" value={phoneNumber} onChange={this.handleChange} />
              </label>
            </div>
            <div className={'form-group' + (submitted && !company ? ' has-error' : '')}>
              <label htmlFor="company">
                <i className="fa fa-building-o" aria-hidden="true"></i>
                <input type="text" className="form-control" name="company" placeholder="Company" value={company} onChange={this.handleChange} />
              </label>
              {submitted && !company && <div className="field-error">Company name is required</div>}
            </div>
            <div className="error-msg-container">
              {this.state.isError && <div className="auth-error-msg">{this.state.responseMsg}</div>}
            </div>
            <div className="form-group">
              <button className="app-btn">Register</button>
            </div>
            <div className="user-agreement-link-wrapper">
              By signing up you agree to our <Link to="/user-agreement" target='_blank'>License Agreement</Link>
            </div>
            <div className="navigation-link-wrapper">
              Already have an account ?<Link className="navigation-link" to="/login"> Login</Link>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    responseMsg: state.get('responseMsg'),
    isError: state.get('isError')
  };
}

export default connect(
  mapStateToProps
)(RegisterView);