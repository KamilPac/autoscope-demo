import { test as base, expect } from "@playwright/test";
import { resetAppDataState } from "../helpers/data-reset";

export const test = base.extend({
  resetData: [
    async ({}, use) => {
      await resetAppDataState();
      await use(undefined);
    },
    { auto: true },
  ],
});

export { expect };
