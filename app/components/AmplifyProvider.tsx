"use client";

import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    try {
      // クライアントサイドでAmplifyを設定
      console.log('Configuring Amplify with outputs:', outputs);
      Amplify.configure(outputs);
      setIsConfigured(true);
      console.log('Amplify configured successfully');
    } catch (error) {
      console.error('Failed to configure Amplify:', error);
    }
  }, []);

  if (!isConfigured) {
    return <div>Loading Amplify configuration...</div>;
  }

  return <>{children}</>;
}