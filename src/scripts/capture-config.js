export function createCaptureConfig() {
  return {
    rrweb: {
      sampling: {
        mousemove: 100,
        scroll: 150,
      },
      checkoutEveryNth: 500,
    },
    axe: {
      enabled: true,
    },
    observers: {
      mutation: true,
      resize: true,
    },
  };
}
