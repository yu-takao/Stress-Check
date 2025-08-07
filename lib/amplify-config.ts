"use client";

import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

// クライアントサイドでのみAmplifyを設定
if (typeof window !== 'undefined') {
  Amplify.configure(outputs);
}

export default outputs;