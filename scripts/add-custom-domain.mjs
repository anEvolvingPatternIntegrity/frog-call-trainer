#!/usr/bin/env node
/**
 * scripts/add-custom-domain.mjs — Wire a custom subdomain to the CloudFront distribution.
 *
 * What it does:
 *   1. Requests a free ACM certificate for your subdomain (us-east-1, required for CloudFront)
 *   2. Prints the DNS CNAME record you must add in Dreamhost to prove domain ownership
 *   3. Waits until AWS confirms the certificate is valid
 *   4. Updates the CloudFront distribution to accept the subdomain + use the cert
 *   5. Prints the final CNAME record to add in Dreamhost to route traffic
 *
 * Usage:
 *   node scripts/add-custom-domain.mjs frog-call-training.yourdomain.com
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import * as readline from 'readline/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const configPath = join(root, '.aws-deploy.json');
const PROFILE = 'personal';

// ─── Args ────────────────────────────────────────────────────────────────────

const domain = process.argv[2];
if (!domain || domain.startsWith('--')) {
  console.error('\nUsage: node scripts/add-custom-domain.mjs frog-call-training.yourdomain.com\n');
  process.exit(1);
}

if (!existsSync(configPath)) {
  console.error('\nERROR: .aws-deploy.json not found. Run node scripts/setup-aws.mjs first.\n');
  process.exit(1);
}

const { distributionId, distributionDomain } = JSON.parse(readFileSync(configPath, 'utf-8'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function run(cmd) {
  process.stdout.write(`  $ ${cmd.replace(/\s+/g, ' ').trim()}\n`);
  return execSync(cmd.replace(/\s+/g, ' ').trim(), { encoding: 'utf-8' }).trim();
}

function runJson(cmd) {
  return JSON.parse(run(cmd));
}

function tmpJson(name, obj) {
  const p = join(tmpdir(), `fct-${name}-${Date.now()}.json`);
  writeFileSync(p, JSON.stringify(obj, null, 2));
  return p;
}

function cleanup(...paths) {
  for (const p of paths) { try { unlinkSync(p); } catch {} }
}

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer;
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log('\n🐸 Frog Call Trainer — Custom Domain Setup');
console.log(`   Domain:       ${domain}`);
console.log(`   Distribution: ${distributionId}`);
console.log(`   Profile:      ${PROFILE}\n`);

// 1. Request ACM certificate
// Must be in us-east-1 — CloudFront only accepts certs from that region
console.log('1. Requesting ACM certificate (us-east-1)...');
const certResult = runJson(
  `aws acm request-certificate
    --domain-name ${domain}
    --validation-method DNS
    --region us-east-1
    --profile ${PROFILE}`
);
const certArn = certResult.CertificateArn;
console.log(`   Certificate ARN: ${certArn}\n`);

// 2. Get the DNS validation record
// Give AWS a moment to populate it
console.log('2. Fetching DNS validation record (may take a few seconds)...');
let validationRecord = null;
for (let i = 0; i < 10; i++) {
  await new Promise((r) => setTimeout(r, 3000));
  const desc = runJson(
    `aws acm describe-certificate
      --certificate-arn ${certArn}
      --region us-east-1
      --profile ${PROFILE}`
  );
  validationRecord = desc.Certificate?.DomainValidationOptions?.[0]?.ResourceRecord;
  if (validationRecord) break;
}

if (!validationRecord) {
  console.error('\nERROR: Timed out waiting for validation record. Re-run the script.\n');
  process.exit(1);
}

console.log('\n┌─────────────────────────────────────────────────────────────────┐');
console.log('│  Step A — Add this CNAME in Dreamhost DNS (for cert validation)  │');
console.log('├─────────────────────────────────────────────────────────────────┤');
console.log(`│  Type:  CNAME                                                    │`);
console.log(`│  Name:  ${validationRecord.Name.padEnd(58)}│`);
console.log(`│  Value: ${validationRecord.Value.padEnd(58)}│`);
console.log('└─────────────────────────────────────────────────────────────────┘');
console.log('\n  Dreamhost panel: Websites → Manage Domains → DNS → Add Record');
console.log('  Note: DNS propagation can take up to 30 min.\n');

await prompt('  Press Enter once you have added the record and it has had time to propagate...');

// 3. Wait for certificate validation
console.log('\n3. Waiting for certificate validation (polls every 30s)...');
try {
  run(
    `aws acm wait certificate-validated
      --certificate-arn ${certArn}
      --region us-east-1
      --profile ${PROFILE}`
  );
} catch {
  console.error('\nERROR: Certificate validation timed out or failed.');
  console.error(`Check the cert status in the AWS console and re-run if needed.\n`);
  process.exit(1);
}
console.log('   Certificate validated!\n');

// 4. Update CloudFront distribution — add alternate domain + attach cert
console.log('4. Updating CloudFront distribution...');

const { DistributionConfig: currentConfig, ETag: etag } = runJson(
  `aws cloudfront get-distribution-config
    --id ${distributionId}
    --profile ${PROFILE}`
);

// Add the custom domain to Aliases and attach the ACM cert
const existingAliases = currentConfig.Aliases?.Items ?? [];
if (!existingAliases.includes(domain)) {
  existingAliases.push(domain);
}
currentConfig.Aliases = { Quantity: existingAliases.length, Items: existingAliases };
currentConfig.ViewerCertificate = {
  ACMCertificateArn: certArn,
  SSLSupportMethod: 'sni-only',
  MinimumProtocolVersion: 'TLSv1.2_2021',
  CertificateSource: 'acm',
};

const configFile = tmpJson('cf-update', currentConfig);
runJson(
  `aws cloudfront update-distribution
    --id ${distributionId}
    --distribution-config file://${configFile}
    --if-match ${etag}
    --profile ${PROFILE}`
);
cleanup(configFile);
console.log('   Distribution updated.\n');

// 5. Final instructions
console.log('┌─────────────────────────────────────────────────────────────────┐');
console.log('│  Step B — Add this CNAME in Dreamhost DNS (to route traffic)    │');
console.log('├─────────────────────────────────────────────────────────────────┤');
console.log(`│  Type:  CNAME                                                    │`);
console.log(`│  Name:  ${domain.padEnd(58)}│`);
console.log(`│  Value: ${distributionDomain.padEnd(58)}│`);
console.log('└─────────────────────────────────────────────────────────────────┘');
console.log('\n  This is separate from the validation record — both must be present.');
console.log('  CloudFront also needs ~5–15 min to deploy the config change.\n');
console.log(`✅ Done! Once DNS propagates: https://${domain}\n`);
