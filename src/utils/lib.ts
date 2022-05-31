export const log = (type: 'info' | 'warn' | 'error', text: string, data?: any) => {
  console[type](type, text, data);
};

export const getUniqueUserId = () => new Date().getTime(); // TODO get from server

export const getTarget = () => {
  const {
    location: { pathname },
  } = window;
  return parseInt(pathname.replace(/^\//, ''), 10);
};

export const parseMessage = (message: string): object => {
  let result = {};
  try {
    result = JSON.parse(message);
  } catch (e) {
    /** */
  }
  return result;
};
