// convex/payments/catalog.ts
export interface CoinPackage {
  key: string;
  title: string;
  coins: number;
  amountInr: number;
  amountPaise: number;
  badge?: string;
}

export const COIN_PACKAGES: CoinPackage[] = [
  {
    key: "pack-100",
    title: "Starter Pouch",
    coins: 100,
    amountInr: 29,
    amountPaise: 2900,
  },
  {
    key: "pack-200",
    title: "Adventurer Chest",
    coins: 200,
    amountInr: 49,
    amountPaise: 4900,
    badge: "Popular",
  },
  {
    key: "pack-500",
    title: "Champion Vault",
    coins: 500,
    amountInr: 99,
    amountPaise: 9900,
    badge: "Best Value",
  },
  {
    key: "pack-1000",
    title: "Sovereign Treasury",
    coins: 1000,
    amountInr: 199,
    amountPaise: 19900,
  },
];

export function getCoinPackageByKey(key: string): CoinPackage | undefined {
  return COIN_PACKAGES.find((p) => p.key === key);
}