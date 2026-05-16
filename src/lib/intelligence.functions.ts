import { createServerFn } from '@tanstack/react-start';
import {
  computeThemeClusters,
  getLatestBriefRow,
  generateAndStoreBrief,
} from './intelligence.server';

export const getThemeClusters = createServerFn({ method: 'GET' }).handler(async () => {
  return { clusters: computeThemeClusters() };
});

export const getLatestBrief = createServerFn({ method: 'GET' }).handler(async () => {
  const brief = await getLatestBriefRow();
  return { brief };
});

export const regenerateBrief = createServerFn({ method: 'POST' }).handler(async () => {
  const brief = await generateAndStoreBrief();
  return { brief };
});
