import 'reflect-metadata';
import { spawn } from 'child_process';

type PipelineFlags = {
  datasetOutput?: string;
  modelOutput?: string;
  summaryOutput?: string;
  days?: string;
  topK?: string;
  topN?: string;
  ttlHours?: string;
  algorithm?: string;
};

const parseFlag = (flagName: string): string | undefined => {
  const exactMatch = process.argv.find((argument) => argument.startsWith(`${flagName}=`));
  if (exactMatch) {
    return exactMatch.slice(flagName.length + 1);
  }

  const index = process.argv.findIndex((argument) => argument === flagName);
  if (index >= 0) {
    return process.argv[index + 1];
  }

  return undefined;
};

const collectPipelineFlags = (): PipelineFlags => ({
  datasetOutput: parseFlag('--dataset-out'),
  modelOutput: parseFlag('--model-out'),
  summaryOutput: parseFlag('--summary-out'),
  days: parseFlag('--days'),
  topK: parseFlag('--top-k'),
  topN: parseFlag('--top-n'),
  ttlHours: parseFlag('--ttl-hours'),
  algorithm: parseFlag('--algorithm'),
});

const buildArgs = (
  scriptPath: string,
  flags: Array<[string, string | undefined]>
): string[] => {
  const args = ['-r', 'tsconfig-paths/register', scriptPath];

  for (const [flagName, value] of flags) {
    if (!value) {
      continue;
    }

    args.push(`${flagName}=${value}`);
  }

  return args;
};

const runStep = async (label: string, args: string[]): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('ts-node', args, {
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (exitCode) => {
      if (exitCode === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${exitCode ?? 'unknown'}`));
    });
  });
};

async function refreshRecommendationPipeline(): Promise<void> {
  const flags = collectPipelineFlags();

  console.log('Starting recommendation pipeline refresh...');

  await runStep(
    'dataset export',
    buildArgs('src/scripts/export-recommendation-dataset.ts', [
      ['--days', flags.days],
      ['--out', flags.datasetOutput],
    ])
  );

  await runStep(
    'baseline training',
    buildArgs('src/scripts/train-recommendation-baseline.ts', [
      ['--input', flags.datasetOutput],
      ['--out', flags.modelOutput],
      ['--top-k', flags.topK],
      ['--top-n', flags.topN],
    ])
  );

  await runStep(
    'cache precompute',
    buildArgs('src/scripts/precompute-recommendation-cache.ts', [
      ['--input', flags.modelOutput],
      ['--summary-out', flags.summaryOutput],
      ['--ttl-hours', flags.ttlHours],
      ['--algorithm', flags.algorithm],
    ])
  );

  console.log('Recommendation pipeline refresh completed successfully.');
}

void refreshRecommendationPipeline().catch((error) => {
  console.error('Failed to refresh recommendation pipeline:', error);
  process.exit(1);
});
