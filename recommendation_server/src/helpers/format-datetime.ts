// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";

// // trigger plugin
// dayjs.extend(utc);
// dayjs.extend(timezone);

// export const getVNTime = (): string => {
//   return dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
// };


import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// trigger plugin
dayjs.extend(utc);
dayjs.extend(timezone);

export const getVNTime = (date?: Date | string): string => {
  if (date) {
    return dayjs(date).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
  }
  return dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
};

// Thêm function format cho existing dates
export const formatDateTime = (date: Date | string): string => {
  return dayjs(date).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
};