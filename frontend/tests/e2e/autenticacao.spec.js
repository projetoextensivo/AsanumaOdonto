import { test, expect } from './support/fixtures.js';
import { DEMO_EMAIL, DEMO_PASSWORD, secretaryData, suffix } from './support/helpers.js';

test('login com credenciais válidas abre o dashboard', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('seuemail@clinica.com').fill(DEMO_EMAIL);
  await page.getByPlaceholder('Digite sua senha').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  await expect(page).toHaveURL((url) => url.hash === '#dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await expect(page.getByText('Lucas Maximo', { exact: true })).toBeVisible();
});

test('login com credenciais inválidas exibe mensagem de erro', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('seuemail@clinica.com').fill(`inexistente-${suffix()}@exemplo.invalid`);
  await page.getByPlaceholder('Digite sua senha').fill('SenhaErrada@2026');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos.');
  await expect(page).toHaveURL(/#login$/);
  await expect(page.getByPlaceholder('seuemail@clinica.com')).toBeVisible();
});

test('recuperação de senha informa que o envio de e-mails não está configurado', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click();

  await expect(page.getByRole('alert')).toContainText('O envio de e-mails ainda não está configurado.');
});

test('logout encerra a sessão e bloqueia páginas protegidas', async ({ adminPage }) => {
  await adminPage.getByRole('button', { name: 'Sair da conta' }).click();
  const dialog = adminPage.getByRole('dialog');
  await expect(dialog).toContainText('Sair da conta?');
  await dialog.getByRole('button', { name: 'Sair da conta' }).click();

  await expect(adminPage).toHaveURL(/#login$/);
  await expect(adminPage.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();

  await adminPage.goto('/#pacientes');
  await adminPage.reload();
  await expect(adminPage).toHaveURL(/#login$/);
  await expect(adminPage.getByPlaceholder('seuemail@clinica.com')).toBeVisible();
});

test('cadastro público cria secretária com acesso limitado', async ({ page, cleanup }) => {
  const account = secretaryData();
  cleanup.user(account.email);

  await page.goto('/');
  await page.getByRole('button', { name: 'Cadastre-se' }).click();
  await page.getByPlaceholder('Digite seu nome').fill(account.name);
  await page.getByPlaceholder('seuemail@clinica.com').fill(account.email);
  await page.getByPlaceholder('Mín. 8 caracteres').fill(account.password);
  await page.getByPlaceholder('Repita a senha').fill(account.password);
  await page.getByRole('checkbox', { name: /Li e aceito os termos de uso/ }).check();
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page).toHaveURL((url) => ['#agenda', '#dashboard'].includes(url.hash));
  await expect(page.getByRole('heading', { name: 'Nossa agenda', exact: true })).toBeVisible();
  await expect(page.getByText('Secretária', { exact: true })).toBeVisible();
  await expect(page.locator('nav a[href="#dashboard"]')).toHaveCount(0);
  await expect(page.locator('nav a[href="#procedimentos"]')).toHaveCount(0);
  await expect(page.locator('nav a[href="#prontuarios"]')).toHaveCount(0);
  await expect(page.locator('nav a[href="#pacientes"]')).toHaveCount(1);
});

test('termos de uso são exibidos no cadastro', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Cadastre-se' }).click();
  await page.getByRole('button', { name: 'termos de uso' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Termos de uso' })).toBeVisible();
  await expect(dialog).toContainText('Utilize apenas dados fictícios nesta versão.');
  await dialog.getByRole('button', { name: 'Entendi' }).click();
  await expect(dialog).toBeHidden();
});
