export const SDK_CDN_URL =
  "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs";

export class RelayerSDKLoader {
  load(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).relayerSDK) {
        console.log("RelayerSDK already loaded");
        return resolve();
      }
      
      console.log("Loading RelayerSDK from:", SDK_CDN_URL);
      const script = document.createElement("script");
      script.src = SDK_CDN_URL;
      script.type = "text/javascript";
      script.async = true;
      
      script.onload = () => {
        console.log("RelayerSDK loaded successfully");
        // 等待一下确保 SDK 完全初始化
        setTimeout(() => {
          if ((window as any).relayerSDK) {
            resolve();
          } else {
            reject(new Error("RelayerSDK loaded but not available"));
          }
        }, 100);
      };
      
      script.onerror = () => {
        console.error("Failed to load RelayerSDK");
        reject(new Error(`Failed to load ${SDK_CDN_URL}`));
      };
      
      document.head.appendChild(script);
    });
  }
}


