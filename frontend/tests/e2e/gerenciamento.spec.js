import { test, expect } from './support/fixtures.js';
import { createAppointment, createPatient, createProcedure } from './support/helpers.js';

test('edição de paciente é persistida após recarregar a página', async ({ adminPage, adminApi, cleanup }) => {
  const patient = await createPatient(adminApi);
  cleanup.patient(patient);
  const editedName = `${patient.name} Editado`;

  await adminPage.reload();
  await adminPage.locator('nav a[href="#pacientes"]').click();
  await adminPage.getByPlaceholder('Buscar por nome, telefone ou e-mail...').fill(patient.name);
  await adminPage.getByRole('button', { name: new RegExp('^' + patient.name) }).click();
  await adminPage.getByRole('button', { name: 'Editar dados', exact: true }).click();

  const dialog = adminPage.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Editar paciente' })).toBeVisible();
  await dialog.getByLabel('Nome completo').fill(editedName);
  await dialog.getByLabel('Status').selectOption('Em tratamento');
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click();

  await expect(dialog).toBeHidden();
  await adminPage.getByPlaceholder('Buscar por nome, telefone ou e-mail...').fill(editedName);
  const row = adminPage.locator('table.patients-table tbody tr');
  await expect(row).toContainText(editedName);
  await expect(row).toContainText('Em tratamento');

  await adminPage.reload();
  await adminPage.getByPlaceholder('Buscar por nome, telefone ou e-mail...').fill(editedName);
  await expect(adminPage.locator('table.patients-table tbody tr')).toContainText(editedName);
});

test('exclusão de paciente remove o registro da aplicação', async ({ adminPage, adminApi, cleanup }) => {
  const patient = await createPatient(adminApi);
  cleanup.patient(patient);

  await adminPage.reload();
  await adminPage.locator('nav a[href="#pacientes"]').click();
  await adminPage.getByPlaceholder('Buscar por nome, telefone ou e-mail...').fill(patient.name);
  await adminPage.getByRole('button', { name: new RegExp('^' + patient.name) }).click();
  await adminPage.getByRole('button', { name: 'Excluir paciente' }).click();

  const dialog = adminPage.getByRole('dialog');
  await expect(dialog).toContainText(patient.name);
  await dialog.getByRole('button', { name: 'Excluir registro' }).click();

  await expect(adminPage.getByText('Nenhum paciente encontrado')).toBeVisible();
  const patients = await (await adminApi.get('/api/patients')).json();
  expect(patients.some((item) => item.id === patient.id)).toBe(false);
});

test('procedimento pode ser editado e excluído', async ({ adminPage, adminApi, cleanup }) => {
  const procedure = await createProcedure(adminApi);
  cleanup.procedure(procedure);
  const editedName = `${procedure.name} Editado`;

  await adminPage.reload();
  await adminPage.locator('nav a[href="#procedimentos"]').click();
  await adminPage.getByPlaceholder('Buscar procedimento...').fill(procedure.name);
  await adminPage.getByRole('button', { name: `Editar ${procedure.name}` }).click();

  let dialog = adminPage.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Editar procedimento' })).toBeVisible();
  await dialog.getByLabel('Nome do procedimento').fill(editedName);
  await dialog.getByLabel('Valor (R$)').fill('199.90');
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click();

  await adminPage.getByPlaceholder('Buscar procedimento...').fill(editedName);
  await expect(adminPage.getByRole('heading', { name: editedName })).toBeVisible();
  await adminPage.reload();
  await adminPage.getByPlaceholder('Buscar procedimento...').fill(editedName);
  await expect(adminPage.getByRole('heading', { name: editedName })).toBeVisible();

  await adminPage.getByRole('button', { name: `Excluir ${editedName}` }).click();
  dialog = adminPage.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Excluir registro' }).click();

  await expect(adminPage.getByText('Nenhum procedimento encontrado')).toBeVisible();
  const procedures = await (await adminApi.get('/api/procedures')).json();
  expect(procedures.some((item) => item.id === procedure.id)).toBe(false);
});

test('atendimento registrado no prontuário permanece após recarregar', async ({ adminPage, adminApi, cleanup }) => {
  const patient = await createPatient(adminApi);
  cleanup.patient(patient);
  const title = `Atendimento Ficticio ${patient.name}`;

  await adminPage.reload();
  await adminPage.locator('nav a[href="#pacientes"]').click();
  await adminPage.getByPlaceholder('Buscar por nome, telefone ou e-mail...').fill(patient.name);
  await adminPage.getByRole('button', { name: new RegExp('^' + patient.name) }).click();
  await adminPage.getByRole('button', { name: 'Abrir prontuário', exact: true }).click();

  await expect(adminPage).toHaveURL((url) => url.hash.startsWith('#prontuarios/'));
  await adminPage.getByRole('button', { name: 'Novo atendimento' }).click();
  const dialog = adminPage.getByRole('dialog');
  await dialog.getByPlaceholder('Ex.: Consulta de avaliação').fill(title);
  await dialog.getByPlaceholder('Descreva o atendimento, as observações e as orientações ao paciente.')
    .fill('Atendimento fictício registrado pela suíte E2E.');
  await dialog.getByRole('button', { name: 'Salvar atendimento' }).click();

  await expect(dialog).toBeHidden();
  await expect(adminPage.getByText(title)).toBeVisible();
  await adminPage.reload();
  await expect(adminPage.getByText(title)).toBeVisible();
});

test('agendamento pode ser alterado e excluído pela agenda', async ({ adminPage, adminApi, cleanup }) => {
  const patient = await createPatient(adminApi);
  const procedure = await createProcedure(adminApi);
  const appointment = await createAppointment(adminApi, patient.id, procedure.id, '15:00');
  cleanup.appointment(appointment.id);
  cleanup.patient(patient);
  cleanup.procedure(procedure);

  await adminPage.reload();
  await adminPage.locator('nav a[href="#agenda"]').click();
  const event = adminPage.locator('[data-appointment-id]').filter({ hasText: patient.name });
  await expect(event).toBeVisible();
  await event.click();

  let dialog = adminPage.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Editar agendamento' })).toBeVisible();
  await dialog.getByRole('combobox', { name: /^Status/ }).selectOption('Concluída');
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(dialog).toBeHidden();

  await expect.poll(async () => {
    const updated = await (await adminApi.get(`/api/appointments/${appointment.id}`)).json();
    return updated.status;
  }).toBe('Concluída');

  await event.click();
  dialog = adminPage.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Excluir consulta' }).click();
  await adminPage.getByRole('dialog').getByRole('button', { name: 'Excluir registro' }).click();

  await expect(event).toHaveCount(0);
  const response = await adminApi.get(`/api/appointments/${appointment.id}`);
  expect(response.status()).toBe(404);
});
