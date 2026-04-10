import { spawn } from 'child_process';
import { logger } from '@/utils/logger';

type RecommendationRefreshSchedulerOptions = {
  enabled: boolean;
  intervalMinutes: number;
  runOnStart: boolean;
  days: number;
  topK: number;
  topN: number;
  ttlHours: number;
  algorithm: string;
};

export class RecommendationRefreshScheduler {
  private readonly options: RecommendationRefreshSchedulerOptions;
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(options: RecommendationRefreshSchedulerOptions) {
    this.options = options;
  }

  start(): void {
    if (!this.options.enabled) {
      logger.log('Recommendation refresh scheduler is disabled.');
      return;
    }

    logger.log(
      `Recommendation refresh scheduler enabled. Interval: ${this.options.intervalMinutes} minutes.`
    );

    if (this.options.runOnStart) {
      void this.run('startup');
    }

    this.timer = setInterval(() => {
      void this.run('interval');
    }, this.options.intervalMinutes * 60 * 1000);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async run(trigger: 'startup' | 'interval'): Promise<void> {
    if (this.isRunning) {
      logger.log(
        `Skipping recommendation pipeline refresh (${trigger}) because a previous run is still in progress.`
      );
      return;
    }

    this.isRunning = true;

    try {
      logger.log(`Starting recommendation pipeline refresh from scheduler (${trigger}).`);
      await this.executePipeline();
      logger.success(`Recommendation pipeline refresh completed (${trigger}).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Recommendation pipeline refresh failed (${trigger}): ${message}`);
    } finally {
      this.isRunning = false;
    }
  }

  private async executePipeline(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const commandArgs = [
        'run',
        'refresh:recommendation-pipeline',
        '--',
        `--days=${this.options.days}`,
        `--top-k=${this.options.topK}`,
        `--top-n=${this.options.topN}`,
        `--ttl-hours=${this.options.ttlHours}`,
        `--algorithm=${this.options.algorithm}`,
      ];

      const child = spawn('npm', commandArgs, {
        cwd: process.cwd(),
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

        reject(new Error(`refresh:recommendation-pipeline exited with code ${exitCode ?? 'unknown'}`));
      });
    });
  }
}
