#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsOverlayStack } from '../lib/aws-overlay-stack';

const app = new cdk.App();
new AwsOverlayStack(app, 'AwsOverlayStack');
