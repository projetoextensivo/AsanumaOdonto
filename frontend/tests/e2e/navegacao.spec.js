import { test, expect } from './support/fixtures.js';
import { watchPageErrors } from './support/helpers.js';

test('página inicial apresenta login para visitante não autenticado', async ({ page }) => {
  const errors = watchPageErrors(page);

  await page.goto('/');

  await expect(page).toHaveURL(/#login$/);
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('seuemail@clinica.com')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explorar demonstração' })).toBeVisible();
  expect(errors()).toEqual([]);
});

test('administradora navega entre todas as páginas principais', async ({ adminPage }) => {
  const errors = watchPageErrors(adminPage);
  const routes = [
    ['#dashboard', 'Dashboard'],
    ['#pacientes', 'Nossos pacientes'],
    ['#procedimentos', 'Nossos procedimentos'],
    ['#prontuarios', 'Prontuários'],
    ['#agenda', 'Nossa agenda'],
  ];

  for (const [hash, heading] of routes) {
    await adminPage.locator(`nav[aria-label="Navegação principal"] a[href="${hash}"]`).click();
    await expect(adminPage).toHaveURL((url) => url.hash === hash);
    await expect(adminPage.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(adminPage.locator(`nav a[href="${hash}"]`)).toHaveAttribute('aria-current', 'page');
  }

  await adminPage.getByRole('button', { name: 'Configurações', exact: true }).click();
  await expect(adminPage).toHaveURL((url) => url.hash === '#configuracoes');
  await expect(adminPage.getByRole('heading', { name: 'Configurações', exact: true })).toBeVisible();
  expect(errors()).toEqual([]);
});

test('link de acessibilidade e aviso de alterações não salvas funcionam', async ({ adminPage }) => {
  await adminPage.getByRole('link', { name: 'Pular para o conteúdo' }).focus();
  await adminPage.keyboard.press('Enter');
  await expect(adminPage.locator('#main-content')).toBeFocused();

  await adminPage.getByRole('button', { name: 'Configurações', exact: true }).click();
  await adminPage.getByLabel('Seu nome').fill('Nome Temporario E2E');

  await adminPage.locator('nav a[href="#agenda"]').click();
  const dialog = adminPage.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Se sair agora, as alterações feitas neste formulário serão perdidas.')).toBeVisible();
  await adminPage.getByRole('button', { name: 'Continuar editando' }).click();
  await expect(adminPage).toHaveURL((url) => url.hash === '#configuracoes');

  await adminPage.locator('nav a[href="#agenda"]').click();
  await adminPage.getByRole('button', { name: 'Sair mesmo assim' }).click();
  await expect(adminPage).toHaveURL((url) => url.hash === '#agenda');
  await expect(adminPage.getByRole('heading', { name: 'Nossa agenda', exact: true })).toBeVisible();
});
