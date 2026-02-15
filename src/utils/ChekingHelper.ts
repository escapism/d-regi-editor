interface NavigatorUAData {
  platform: string;
}

declare global {
  interface Navigator {
    userAgentData?: NavigatorUAData;
  }
}

export const isMac = (() => {
  const result: boolean = (() => {
    if (navigator.userAgentData) {
      return navigator.userAgentData.platform.toLowerCase().includes("mac");
    }
    return navigator.userAgent.toLowerCase().includes("mac");
  })();

  return () => result;
})();
