import { test as base, expect } from '@playwright/test';
import { BASE_URL, DEMO_EMAIL, DEMO_PASSWORD, findByField } from './helpers.js';

async function deleteIfExists(api, endpoint, id) {
  if (!id) return;
  const response = await api.delete(`${endpoint}/${id}`);
  expect(response.ok()).toBeTruthy();
}

export const test = base.extend({
  adminApi: async ({ playwright }, use) => {
    const api = await playwright.request.newContext({ baseURL: BASE_URL });
    const response = await api.post('/api/auth/login', {
      data: { email: DEMO_EMAIL, password: DEMO_PASSWORD, remember: false },
    });
    expect(response.ok()).toBeTruthy();
    await use(api);
    await api.dispose();
  },

  adminPage: async ({ browser, adminApi }, use) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'pt-BR',
      storageState: await adminApi.storageState(),
    });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Sair da conta' })).toBeVisible();
    await use(page);
    await context.close();
  },

  cleanup: async ({ adminApi }, use) => {
    const tasks = [];
    const register = (priority, task) => tasks.push({ priority, task });
    await use({
      appointment: (id) => register(0, () => deleteIfExists(adminApi, '/api/appointments', id)),
      patient: (nameOrId) => register(1, async () => {
        const id = typeof nameOrId === 'object'
          ? nameOrId.id
          : (await findByField(adminApi, '/api/patients', 'name', nameOrId))?.id;
        await deleteIfExists(adminApi, '/api/patients', id);
      }),
      procedure: (nameOrId) => register(2, async () => {
        const id = typeof nameOrId === 'object'
          ? nameOrId.id
          : (await findByField(adminApi, '/api/procedures', 'name', nameOrId))?.id;
        await deleteIfExists(adminApi, '/api/procedures', id);
      }),
      user: (email) => register(3, async () => {
        const id = (await findByField(adminApi, '/api/users', 'email', email))?.id;
        await deleteIfExists(adminApi, '/api/users', id);
      }),
    });

    for (const { task } of tasks.sort((a, b) => a.priority - b.priority)) {
      await task().catch(() => {});
    }
  },
});

export { expect };
