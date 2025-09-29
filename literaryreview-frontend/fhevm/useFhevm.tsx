"use client";

import { useEffect, useMemo, useState } from "react";
import { FhevmDecryptionSignature } from "./FhevmDecryptionSignature";

type FhevmInstance = any;

export function useFhevm(params: { provider?: any; chainId?: number }) {
  const { provider, chainId } = params;
  const [instance, setInstance] = useState<FhevmInstance | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!provider || !chainId) return;
    
    setLoading(true);
    setError("");
    
    const initAsync = async () => {
      try {
        // 等待 relayer SDK 加载
        let retries = 0;
        while (retries < 20 && !(window as any).relayerSDK) {
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
        }
        
        if (!(window as any).relayerSDK) {
          throw new Error("Relayer SDK not loaded after 10 seconds");
        }

        console.log("Initializing FHEVM SDK...");
        const relayerSDK = (window as any).relayerSDK;
        
        // 初始化 SDK
        const initResult = await relayerSDK.initSDK();
        if (!initResult) {
          throw new Error("FHEVM SDK initialization failed");
        }
        
        console.log("Creating FHEVM instance for chainId:", chainId);
        
        // 根据链ID选择配置（为稳定性，Sepolia强制使用RPC URL字符串）
        let config;
        if (chainId === 11155111) {
          const RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com";
          config = { ...relayerSDK.SepoliaConfig, network: RPC };
        } else {
          // 其他网络：优先使用 provider.request；如失败再回退到字符串RPC
          const rpcOrProvider = provider;
          config = { network: rpcOrProvider, chainId } as any;
        }
        
        console.log("Using config:", config);
        const inst = await relayerSDK.createInstance(config);
        
        setInstance(inst);
        console.log("FHE instance created successfully");
        
      } catch (e: any) {
        console.error("Failed to create FHE instance:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    initAsync();
  }, [provider, chainId]);

  const decrypt = useMemo(() => {
    return async (handles: Array<{handle: string, contractAddress: string}>, signer: any) => {
      if (!instance) throw new Error("FHE instance not ready");
      
      console.log("Starting decryption for handles:", handles.length);
      
      const { publicKey, privateKey } = instance.generateKeypair();
      const contractAddresses = [...new Set(handles.map(h => h.contractAddress))];
      
      const sig = await FhevmDecryptionSignature.new(
        instance,
        contractAddresses,
        publicKey,
        privateKey,
        signer
      );
      
      if (!sig) throw new Error("构建解密签名失败");
      
      const result = await instance.userDecrypt(
        handles,
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );
      
      console.log("Decryption completed:", result);
      return result;
    };
  }, [instance]);

  return { 
    instance, 
    decrypt,
    loading,
    error,
    ready: !!instance && !loading 
  } as const;
}