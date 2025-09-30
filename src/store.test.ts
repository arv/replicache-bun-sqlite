import { afterEach, describe, expect, test } from "bun:test";
import { clearAllNamedStoresForTesting } from "replicache/sqlite";
import {
  registerCreatedFile,
  runSQLiteStoreTests,
} from "./sqlite-store-test-util.ts";
import { bunSQLiteStoreProvider, type BunSQLiteStoreOptions } from "./store.ts";
import { withRead, withWrite } from "./with-transactions.ts";

const defaultStoreOptions = {
  busyTimeout: 200,
  journalMode: "WAL",
  synchronous: "NORMAL",
  readUncommitted: false,
} as const;

function createStore(name: string, opts?: BunSQLiteStoreOptions) {
  const provider = bunSQLiteStoreProvider(opts);
  registerCreatedFile(name);
  return provider.create(name);
}

afterEach(async () => {
  const storeProvider = bunSQLiteStoreProvider(defaultStoreOptions);
  clearAllNamedStoresForTesting();
  await storeProvider.drop("pragma_test");
});

test("different configuration options", async () => {
  // Test with different configuration options
  const storeWithOptions = createStore("pragma-test", {
    busyTimeout: 500,
    journalMode: "DELETE",
    synchronous: "FULL",
    readUncommitted: true,
  });

  await withWrite(storeWithOptions, async (wt) => {
    await wt.put("config-test", "configured-value");
  });

  await withRead(storeWithOptions, async (rt) => {
    expect(await rt.get("config-test")).toBe("configured-value");
  });

  await storeWithOptions.close();
});

describe("runSQLiteStoreTests", () => {
  runSQLiteStoreTests<BunSQLiteStoreOptions>({
    storeName: "BunSQLiteStore",
    createStoreProvider: bunSQLiteStoreProvider,
    clearAllNamedStores: clearAllNamedStoresForTesting,
    createStoreWithDefaults: createStore,
    defaultStoreOptions,
  });
});
