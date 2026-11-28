import { expect } from '@playwright/test';

export const DEMO_EMAIL = 'demo@asanumaodonto.com';
export const DEMO_PASSWORD = 'Odonto@2026';
export const BASE_URL = 'http://127.0.0.1:5173';
export const VALID_CPF = '529.982.247-25';

export function suffix() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function clinicDate(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const date = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + offsetDays));
  if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function patientData() {
  const id = suffix();
  return {
    name: `Paciente Ficticio ${id}`,
    phone: '11912345678',
    email: `paciente-${id}@exemplo.invalid`,
    birthDate: '1995-05-10',
    cpf: VALID_CPF,
    status: 'Ativo',
    allergies: '',
    notes: 'Dados ficticios para automacao E2E.',
  };
}

export function procedureData() {
  const id = suffix();
  return {
    name: `Procedimento Ficticio ${id}`,
    category: 'Prevenção',
    description: 'Procedimento ficticio utilizado nos testes E2E.',
    duration: 30,
    price: 123.45,
  };
}

export function secretaryData() {
  const id = suffix();
  return {
    name: `Secretaria Ficticia ${id}`,
    email: `secretaria-${id}@exemplo.invalid`,
    password: 'Senha@E2E2026',
  };
}

export async function loginWithUI(page, email = DEMO_EMAIL, password = DEMO_PASSWORD) {
  await page.goto('/');
  await expect(page.getByPlaceholder('seuemail@clinica.com')).toBeVisible();
  await page.getByPlaceholder('seuemail@clinica.com').fill(email);
  await page.getByPlaceholder('Digite sua senha').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

export function watchPageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (/Failed to load resource: the server responded with a status of (401|403)/.test(message.text())) return;
    errors.push(message.text());
  });
  return () => errors;
}

export async function createPatient(api, data = patientData()) {
  const response = await api.post('/api/patients', { data });
  expect(response.ok()).toBeTruthy();
  return { ...data, id: (await response.json()).id };
}

export async function createProcedure(api, data = procedureData()) {
  const response = await api.post('/api/procedures', { data });
  expect(response.ok()).toBeTruthy();
  return { ...data, id: (await response.json()).id };
}

export async function createAppointment(api, patientId, procedureId, time = '15:00') {
  const data = {
    patientId,
    procedureId,
    date: clinicDate(),
    time,
    status: 'Confirmada',
    dentist: 'Lucas Maximo',
    payment: 'Pix',
    notes: 'Agendamento ficticio para testes E2E.',
    discount: 0,
  };
  const response = await api.post('/api/appointments', { data });
  expect(response.ok()).toBeTruthy();
  return { ...data, id: (await response.json()).id };
}

export async function findByField(api, endpoint, field, value) {
  const response = await api.get(endpoint);
  expect(response.ok()).toBeTruthy();
  const items = await response.json();
  return items.find((item) => item[field] === value);
}
