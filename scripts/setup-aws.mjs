#!/usr/bin/env node
/**
 * scripts/setup-aws.mjs — One-time AWS infrastructure setup.
 *
 * Creates:
 *   - Private S3 bucket
 *   - CloudFront Origin Access Control (OAC)
 *   - CloudFront distribution (HTTPS, SPA routing, optimized caching)
 *   - Bucket policy allowing CloudFront OAC access
 *
 * Saves connection details to .aws-deploy.json (gitignored) for use by
 * scripts/deploy.mjs.
 *
 * Usage:
 *   node scripts/setup-aws.mjs
 *   node scripts/setup-aws.mjs --bucket=my-bucket-name --region=us-east-1
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const configPath = join(root, '.aws-deploy.json');
const PROFILE = 'personal';

// ─── Args ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const BUCKET = args.find((a) => a.startsWith('--bucket='))?.split('=')[1] ?? 'frog-call-trainer';
const REGION = args.find((a) => a.startsWith('--region='))?.split('=')[1] ?? 'us-east-1';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function run(cmd) {
  process.stdout.write(`  $ ${cmd.replace(/\s+/g, ' ').trim()}\n`);
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

function runJson(cmd) {
  return JSON.parse(run(cmd));
}

/** Write an object to a temp file and return the path. */
function tmpJson(name, obj) {
  const p = join(tmpdir(), `fct-${name}-${Date.now()}.json`);
  writeFileSync(p, JSON.stringify(obj, null, 2));
  return p;
}

function cleanup(...paths) {
  for (const p of paths) { try { unlinkSync(p); } catch {} }
}

// ─── Guard ───────────────────────────────────────────────────────────────────

if (existsSync(configPath)) {
  console.error(
    '\nERROR: .aws-deploy.json already exists.\n' +
    'Delete it first if you want to re-run setup (be careful not to create duplicate resources).\n'
  );
  process.exit(1);
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log('\n🐸 Frog Call Trainer — AWS Setup');
console.log(`   Bucket:  ${BUCKET} (${REGION})`);
console.log(`   Profile: ${PROFILE}\n`);

// 1. Account ID
console.log('1. Getting AWS account ID...');
const { Account: accountId } = runJson(
  `aws sts get-caller-identity --profile ${PROFILE}`
);
console.log(`   Account: ${accountId}\n`);

// 2. Create S3 bucket
console.log(`2. Creating S3 bucket: ${BUCKET}...`);
const locationFlag = REGION === 'us-east-1'
  ? ''
  : `--create-bucket-configuration LocationConstraint=${REGION}`;
run(`aws s3api create-bucket --bucket ${BUCKET} --region ${REGION} ${locationFlag} --profile ${PROFILE}`);

// 3. Block all public access
console.log('\n3. Blocking public access...');
run(
  `aws s3api put-public-access-block --bucket ${BUCKET} ` +
  `--public-access-block-configuration ` +
  `BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true ` +
  `--profile ${PROFILE}`
);

// 4. Create CloudFront Origin Access Control
console.log('\n4. Creating Origin Access Control (OAC)...');
const oacFile = tmpJson('oac', {
  Name: `${BUCKET}-oac`,
  Description: `OAC for ${BUCKET} S3 bucket`,
  SigningProtocol: 'sigv4',
  SigningBehavior: 'always',
  OriginAccessControlOriginType: 's3',
});
const oacResult = runJson(
  `aws cloudfront create-origin-access-control ` +
  `--origin-access-control-config file://${oacFile} ` +
  `--profile ${PROFILE}`
);
const oacId = oacResult.OriginAccessControl.Id;
cleanup(oacFile);
console.log(`   OAC ID: ${oacId}`);

// 5. Create CloudFront distribution
console.log('\n5. Creating CloudFront distribution...');
const distFile = tmpJson('dist', {
  CallerReference: `${BUCKET}-${Date.now()}`,
  Comment: BUCKET,
  DefaultRootObject: 'index.html',
  Origins: {
    Quantity: 1,
    Items: [{
      Id: 'S3Origin',
      DomainName: `${BUCKET}.s3.${REGION}.amazonaws.com`,
      S3OriginConfig: { OriginAccessIdentity: '' },
      OriginAccessControlId: oacId,
    }],
  },
  DefaultCacheBehavior: {
    TargetOriginId: 'S3Origin',
    ViewerProtocolPolicy: 'redirect-to-https',
    // AWS managed CachingOptimized policy
    CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
    Compress: true,
    AllowedMethods: {
      Quantity: 2,
      Items: ['GET', 'HEAD'],
      CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] },
    },
  },
  // SPA routing: return index.html for missing paths instead of S3 403/404
  CustomErrorResponses: {
    Quantity: 2,
    Items: [
      { ErrorCode: 403, ResponsePagePath: '/index.html', ResponseCode: '200', ErrorCachingMinTTL: 0 },
      { ErrorCode: 404, ResponsePagePath: '/index.html', ResponseCode: '200', ErrorCachingMinTTL: 0 },
    ],
  },
  // US + Europe only — cheaper than global, right audience for eastern-US field app
  PriceClass: 'PriceClass_100',
  HttpVersion: 'http2and3',
  Enabled: true,
});
const distResult = runJson(
  `aws cloudfront create-distribution ` +
  `--distribution-config file://${distFile} ` +
  `--profile ${PROFILE}`
);
const distributionId = distResult.Distribution.Id;
const distributionDomain = distResult.Distribution.DomainName;
cleanup(distFile);
console.log(`   Distribution ID: ${distributionId}`);
console.log(`   Domain: https://${distributionDomain}`);

// 6. Bucket policy — allow this CloudFront distribution via OAC
console.log('\n6. Applying bucket policy...');
const policyFile = tmpJson('policy', {
  Version: '2012-10-17',
  Statement: [{
    Sid: 'AllowCloudFrontServicePrincipal',
    Effect: 'Allow',
    Principal: { Service: 'cloudfront.amazonaws.com' },
    Action: 's3:GetObject',
    Resource: `arn:aws:s3:::${BUCKET}/*`,
    Condition: {
      StringEquals: {
        'AWS:SourceArn': `arn:aws:cloudfront::${accountId}:distribution/${distributionId}`,
      },
    },
  }],
});
run(`aws s3api put-bucket-policy --bucket ${BUCKET} --policy file://${policyFile} --profile ${PROFILE}`);
cleanup(policyFile);

// 7. Save config for deploy script
console.log('\n7. Saving .aws-deploy.json...');
const config = { bucket: BUCKET, region: REGION, distributionId, distributionDomain };
writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

console.log('\n✅ Setup complete!\n');
console.log(`   Site URL: https://${distributionDomain}`);
console.log('   Note: CloudFront takes ~5–15 min to deploy globally.\n');
console.log('   Next step: node scripts/deploy.mjs\n');
