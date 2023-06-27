import isEmpty from "lodash/isEmpty";

export const logMessage = (name, data = {}) => {
  console.log("====== logMessage ====== ");
  console.log(name);
  if (!isEmpty(data)) {
    console.log(data);
  }
  console.log("====== ====== ");
};
