import { spawnSync } from 'child_process';
import { CONFIG } from './deploy-config.js';

function execAws(args) {
    const environment = Object.create(process.env);
    environment.AWS_PAGER = '';
    spawnSync('aws', args, { stdio: 'inherit', env: environment });
}

const bucket = CONFIG.staticWebsiteBucket;
const cloudfrontDistribution = CONFIG.cloudfrontDistributionId;

console.log(`Uploading static content to bucket ${bucket}...`);
execAws(['s3', 'sync', 'build', `s3://${bucket}/`]);
console.log(`Invalidating cache for Cloudfront distribution ${cloudfrontDistribution}...`);
execAws(['cloudfront', 'create-invalidation', '--distribution-id', cloudfrontDistribution, '--paths', '/*']);
console.log(`Done.`);
