import type { AwsPublicConfig } from './awsConfig';

declare global {
  interface Window {
    __AWS_CONFIG__?: AwsPublicConfig;
  }
}

export {};
