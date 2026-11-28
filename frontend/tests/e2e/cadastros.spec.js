import { test, expect } from './support/fixtures.js';
import { clinicDate, createPatient, createProcedure, patientData, procedureData } from './support/helpers.js';

test('cadastro de paciente com dados válidos persiste e aparece na busca', async ({ adminPage, cleanup }) => {
  const patient = patientData();
  cleanup.patient(patient.name);

  await adminPage.locator('nav a[href="#pacientes"]').click();
  await adminPage.getByRole('button', { name: 'Novo paciente' }).click();
  const dialog = adminPage.getByRole('dialog');
  await dialog.getByLabel('Nome completo').fill(patient.name);
  await dialog.getByLabel('Telefone').fill(patient.phone);
  await dialog.getByLabel('E-mail').fill(patient.email);
  await dialog.getByLabel('Data de nascimento').fill(patient.birthDate);
  await dialog.getByLabel('CPF').fill(patient.cpf);

  await dialog.getByRole('button', { name: 'Cadastrar paciente' }).click();

  await expect(dialog).toBeHidden();
  await expect(adminPage.getByRole('status').filter({ hasText: 'Registro salvo com sucesso.' })).toBeVisible();
  await adminPage.getByPlaceholder('Buscar por nome, telefone ou e-mail...').fill(patient.name);
  await expect(adminPage.locator('table.patients-table tbody tr')).toHaveCount(1);
  await expect(adminPage.locator('table.patients-table tbody tr')).toContainText(patient.name);

  await adminPage.reload();
  await adminPage.getByPlaceholder('Buscar por nome, telefone ou e-mail...').fill(patient.name);
  await expect(adminPage.locator('table.patients-table tbody tr')).toContainText(patient.name);
});

test('cadastro de paciente incompleto não cria registro', async ({ adminPage }) => {
  await adminPage.locator('nav a[href="#pacientes"]').click();
  const initialRows = await adminPage.locator('table.patients-table tbody tr').count();

  await adminPage.getByRole('button', { name: 'Novo paciente' }).click();
  const dialog = adminPage.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Cadastrar paciente' }).click();

  await expect(dialog).toBeVisible();
  expect(await dialog.locator('input[name="name"]').evaluate((element) => element.validity.valueMissing)).toBe(true);
  await expect(adminPage.locator('table.patients-table tbody tr')).toHaveCount(initialRows);
});

test('cadastro de procedimento com dados válidos persiste e aparece na busca', async ({ adminPage, cleanup }) => {
  const procedure = procedureData();
  cleanup.procedure(procedure.name);

  await adminPage.locator('nav a[href="#procedimentos"]').click();
  await adminPage.getByRole('button', { name: 'Novo procedimento' }).click();
  const dialog = adminPage.getByRole('dialog');
  await dialog.getByLabel('Nome do procedimento').fill(procedure.name);
  await dialog.getByLabel('Descrição').fill(procedure.description);
  await dialog.getByLabel('Duração (minutos)').fill(String(procedure.duration));
  await dialog.getByLabel('Valor (R$)').fill(String(procedure.price));

  await dialog.getByRole('button', { name: 'Criar procedimento' }).click();

  await expect(dialog).toBeHidden();
  await adminPage.getByPlaceholder('Buscar procedimento...').fill(procedure.name);
  await expect(adminPage.getByRole('heading', { name: procedure.name })).toBeVisible();

  await adminPage.reload();
  await adminPage.getByPlaceholder('Buscar procedimento...').fill(procedure.name);
  await expect(adminPage.getByRole('heading', { name: procedure.name })).toBeVisible();
});

test('agendamento criado pela agenda aparece no calendário', async ({ adminPage, adminApi, cleanup }) => {
  const patient = await createPatient(adminApi);
  const procedure = await createProcedure(adminApi);
  cleanup.patient(patient);
  cleanup.procedure(procedure);

  await adminPage.reload();
  await adminPage.locator('nav a[href="#agenda"]').click();
  await adminPage.getByRole('button', { name: 'Novo agendamento' }).click();
  const dialog = adminPage.getByRole('dialog');
  await dialog.getByRole('combobox', { name: /^Paciente/ }).selectOption({ label: patient.name });
  await dialog.getByRole('combobox', { name: /^Procedimento/ }).selectOption({ label: procedure.name });
  await dialog.getByLabel('Data', { exact: false }).fill(clinicDate());
  await dialog.getByLabel('Horário', { exact: false }).fill('16:00');

  await dialog.getByRole('button', { name: 'Agendar consulta' }).click();

  await expect(dialog).toBeHidden();
  await expect(adminPage.getByRole('status').filter({ hasText: 'Consulta agendada com sucesso.' })).toBeVisible();
  await expect(adminPage.locator('[data-appointment-id]').filter({ hasText: patient.name })).toBeVisible();

  const appointments = await (await adminApi.get('/api/appointments')).json();
  expect(appointments.some((item) => item.patientId === patient.id && item.procedureId === procedure.id)).toBe(true);
});
