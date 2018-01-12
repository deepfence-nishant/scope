/*eslint-disable*/

import { range } from 'lodash';

// NOTE: All the array operations defined here should be non-mutating.

export function uniformSelect(array, size) {
  if (size > array.length) {
    return array;
  }

  return range(size).map(index =>
    array[parseInt(index * (array.length / (size - (1 - 1e-9))), 10)]
  );
}

export function insertElement(array, index, element) {
  return array.slice(0, index).concat([element], array.slice(index));
}

export function removeElement(array, index) {
  return array.slice(0, index).concat(array.slice(index + 1));
}

export function moveElement(array, from, to) {
  if (from === to) {
    return array;
  }
  return insertElement(removeElement(array, from), to, array[from]);
}

export function intersperse(items, value) {
  return [].concat(...items.map(e => [value, e])).slice(1);
}

export function getOrderedData(type, data) {
  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const anomalyOrder = ['network_anomaly', 'behavioral_anomaly', 'system_audit', 'syscall_anomaly'];
  const resourceOrder = ['processes', 'files', 'network'];
  const result = [];
  if (type === 'severity') {
    severityOrder.forEach((orderedItem) => {
      data.forEach((item) => {
        if (orderedItem === item) {
          result.push(item);
        }
      });
    });
  } else if (type === 'anomaly') {
    anomalyOrder.forEach((orderedItem) => {
      data.forEach((item) => {
        if (orderedItem === item) {
          result.push(item);
        }
      });
    });
  } else if (type === 'resource_type') {
    resourceOrder.forEach(function (item) {
      data.forEach((orderedItem) => {
        if (orderedItem === item) {
          result.push(item);
        }
      });
    });
  }
  return result;
}

export function getLuceneQuery(queryArr) {
  return queryArr.join(' AND ');
}

export function luceneQueryChecker(queryCollection, newQuery) {
  let result;
  if (queryCollection.includes(newQuery)) {
    result = true;
  } else {
    result = false;
  }
  return result;
}

export function updateSearchQueryArr(queryCollection, newQuery) {
  const resultArr = [];
  for (let i = 0; i < queryCollection.length; i += 1) {
    resultArr.push(queryCollection[i]);
  }
  resultArr.push(newQuery);

  return resultArr;
}

export function getObjectKeys(data) {
  return Object.keys(data);
}

export function getUniqueValuesFromObject(containerMap) {
  let result = [];
  for (let container in containerMap) {
    if (result.indexOf(containerMap[container]) === -1 && containerMap[container] != null) {
      result.push(containerMap[container]);
    }
  }
  // let resultantArr = [{name: 'all_containers'}];
  let resultantArr = [];
  result.forEach((option)=> {
    resultantArr.push({name: option});
  });

  return resultantArr;
}
