/*eslint-disable*/

// Method adds 'isVisible' key to each order which helps to filter data on legend click
export function modifyVisualizationData(data) {
  const result = [];
  data.forEach((record) => {
    record.isVisible = true;
    result.push(record);
  });
  return result;
}

// Method removes 'isVisible' key from each order which helps to maintain data
export function maintainVisualizationData(data) {
  if (data) {
    var dataCopy = JSON.parse(JSON.stringify(data));
    dataCopy.forEach((record)=> {
      delete record['isVisible'];
    });
  }
  return dataCopy;
}

// Method to check legend edge case
export function legendEdgeCaseCheck(data) {
  let counter = 0;
  data.forEach((dataRecord)=> {
    if (!dataRecord.isVisible) {
      counter += 1;
    }
  });
  if (counter === data.length) {
    return true;
  } else {
    return false;
  }
}

// Method to check data available or not.
export function isDataAvailable(data) {
  let result;
  if (data && data.length > 0){
    result = true;
  } else {
    result = false;
  }
  return result;
}