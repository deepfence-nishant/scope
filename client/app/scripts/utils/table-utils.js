const ALERTS_TABLE_HEADERS = ['@timestamp', 'event_type', 'severity', 'summary', 'action'];

const VULNERABILITY_TABLE_HEADERS = ['@timestamp', 'cve_id', 'cve_severity', 'cve_container_image', 'cve_description', 'action'];

const ALERT_TYPE = 'alert';
const ALERT_SEVERITY_KEY = 'severity';
const ALERT_SUMMARY_KEY = 'summary';

const VULNERABILITY_TYPE = 'cve';
const VULNERABILITY_SEVERITY_KEY = 'cve_severity';
const VULNERABILITY_SUMMARY_KEY = 'cve_description';

export function getAlertsTableHeader() {
  return ALERTS_TABLE_HEADERS;
}

export function getVulnerabilityHeaders() {
  return VULNERABILITY_TABLE_HEADERS;
}

export function getSeverityByType(type) {
  let result;
  if (type === ALERT_TYPE) {
    result = ALERT_SEVERITY_KEY;
  } else if (type === VULNERABILITY_TYPE) {
    result = VULNERABILITY_SEVERITY_KEY;
  }
  return result;
}

export function getSummaryByType(type) {
  let result;
  if (type === ALERT_TYPE) {
    result = ALERT_SUMMARY_KEY;
  } else if (type === VULNERABILITY_TYPE) {
    result = VULNERABILITY_SUMMARY_KEY;
  }
  return result;
}
