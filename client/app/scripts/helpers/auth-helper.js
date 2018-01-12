/*eslint-disable*/

import { refreshAuthToken } from '../utils/web-api-utils';

export function getAuthHeader() {
  const authToken = localStorage.getItem('authToken');
  let auth;
  if (authToken) {
    auth = `Bearer ${authToken}`;
  } else {
    auth = '';
  }
  return auth;
}

export function getRefreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  let refreshTokenStr;
  if (refreshToken) {
    refreshTokenStr = `Bearer ${refreshToken}`;
  } else {
    refreshTokenStr = '';
  }
  return refreshTokenStr;
}

export function decodeJwtToken(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace('-', '+').replace('_', '/');
  return JSON.parse(window.atob(base64));
}

export function isUserSessionActive() {
  let isSessionActive = false;
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    clearInterval(startTimerForRefreshToken());
    setInterval(()=> {
      startTimerForRefreshToken();
    }, 60 * 5 * 1000);
  } else {
    clearInterval(startTimerForRefreshToken());
  }

  if (authToken) {
    isSessionActive = true;
  } else {
    isSessionActive = false;
  }

  const licenseStatus = localStorage.getItem('licenseStatus');
  if (isSessionActive && licenseStatus == 'false') {
    parent.location.hash = '/settings';
  }

  return isSessionActive;
}

export function startTimerForRefreshToken() {
  if (localStorage.getItem('authToken')) {
    const jwt = decodeJwtToken(localStorage.getItem('authToken'));
    let currentTime = new Date();
    let authTokenExpiryTime = new Date(jwt.exp * 1000);
    var timeDiff = Math.abs(authTokenExpiryTime.getTime() - currentTime.getTime());
    var minuteDiff = Math.round(timeDiff / 60000);
    if (minuteDiff < 30) {
      refreshAuthToken();
    }
  }
}

export function setCompanyLicenseStatus(authToken) {
  if ( authToken ) {
    const tokenDetails = decodeJwtToken(authToken);
    if ( tokenDetails ) {
      const userDetails = tokenDetails.identity;
      if (userDetails.company_license_exists) {
        localStorage.setItem('licenseStatus', true);
      } else {
        localStorage.setItem('licenseStatus', false);
      }
    }
  }
}

export function isCompanyLicenseActive() {
  const licenseStatus = localStorage.getItem('licenseStatus');
  return licenseStatus == 'true';
}

export function getUserRole() {
  if (localStorage.getItem('authToken')) {
    const jwt = decodeJwtToken(localStorage.getItem('authToken'));
    var userRole = jwt.identity.role;
  }
  return userRole;
}