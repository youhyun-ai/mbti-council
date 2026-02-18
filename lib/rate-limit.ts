const MAX_REQUESTS_PER_DAY = 3;

type RateLimitRecord = {
  dateKey: string;
  count: number;
};

const ipUsage = new Map<string, RateLimitRecord>();

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export function checkAndConsumeDailyCouncilLimit(ip: string): {
  allowed: boolean;
  remaining: number;
} {
  const today = getDateKey();
  const current = ipUsage.get(ip);

  if (!current || current.dateKey !== today) {
    ipUsage.set(ip, { dateKey: today, count: 1 });
    return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - 1 };
  }

  if (current.count >= MAX_REQUESTS_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  ipUsage.set(ip, current);
  return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - current.count };
}
