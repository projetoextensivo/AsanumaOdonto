import { test, expect } from './support/fixtures.js';
import { DEMO_EMAIL, DEMO_PASSWORD, watchPageErrors } from './support/helpers.js';

const mobileViewport = { width: 390, height: 844 };

async function expectNoHorizontalOverflow(page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 1);
}

test('layout desktop mantém menu e páginas principais acessíveis', async ({ adminPage }) => {
  const errors = watchPageErrors(adminPage);

  await expect(adminPage.locator('nav[aria-label="Navegação principal"]')).toBeVisible();
  await expect(adminPage.getByRole('button', { name: 'Abrir menu' })).toBeHidden();
  await adminPage.locator('nav a[href="#dashboard"]').click();
  await expect(adminPage.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await adminPage.locator('nav a[href="#pacientes"]').click();
  await expect(adminPage.getByRole('button', { name: 'Novo paciente' })).toBeVisible();
  await expectNoHorizontalOverflow(adminPage);
  expect(errors()).toEqual([]);
});

test('login é utilizável em resolução mobile', async ({ browser }) => {
  const context = await browser.newContext({ viewport: mobileViewport, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.getByPlaceholder('seuemail@clinica.com')).toBeVisible();
  await expect(page.getByPlaceholder('Digite sua senha')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByPlaceholder('seuemail@clinica.com').fill(DEMO_EMAIL);
  await page.getByPlaceholder('Digite sua senha').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();

  await context.close();
});

test('menu mobile abre, navega e mantém formulários acessíveis', async ({ browser, adminApi }) => {
  const context = await browser.newContext({
    viewport: mobileViewport,
    isMobile: true,
    hasTouch: true,
    storageState: await adminApi.storageState(),
  });
  const page = await context.newPage();
  await page.goto('/');

  const sidebar = page.locator('aside.sidebar, .sidebar').first();
  const menuButton = page.getByRole('button', { name: 'Abrir menu' });
  await expect(menuButton).toBeVisible();
  expect((await sidebar.boundingBox()).x).toBeLessThan(0);

  await menuButton.click();
  await expect.poll(async () => (await sidebar.boundingBox()).x).toBeGreaterThanOrEqual(0);
  await page.locator('nav a[href="#pacientes"]').click();
  await expect(page.getByRole('heading', { name: 'Nossos pacientes', exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Novo paciente' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Nome completo')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cadastrar paciente' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await context.close();
});

test('controles da agenda permanecem acessíveis em resolução mobile', async ({ browser, adminApi }) => {
  const context = await browser.newContext({
    viewport: mobileViewport,
    isMobile: true,
    hasTouch: true,
    storageState: await adminApi.storageState(),
  });
  const page = await context.newPage();
  await page.goto('/#agenda');

  await expect(page.getByRole('heading', { name: 'Nossa agenda', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Novo agendamento' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hoje' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dia' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Dia' }).click();
  await expect(page.getByRole('button', { name: 'Dia' })).toHaveAttribute('aria-pressed', 'true');
  await expectNoHorizontalOverflow(page);

  await context.close();
});
