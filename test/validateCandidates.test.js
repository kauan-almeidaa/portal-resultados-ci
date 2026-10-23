const test = require('node:test');
const assert = require('node:assert/strict');
const { validateDataset } = require('../src/validateCandidates');

function validDataset() {
  return {
    metadata: { minimumScore: 60 },
    candidates: [
      {
        registration: 'MAT-1001',
        cpf: '11122233344',
        name: 'Ana Souza',
        score: 82,
        status: 'APROVADO'
      },
      {
        registration: 'MAT-1002',
        cpf: '22233344455',
        name: 'Bruno Lima',
        score: 58,
        status: 'LISTA_ESPERA'
      }
    ]
  };
}

test('aceita lote consistente', () => {
  assert.deepEqual(validateDataset(validDataset()), []);
});

test('rejeita CPF duplicado', () => {
  const dataset = validDataset();
  dataset.candidates[1].cpf = dataset.candidates[0].cpf;

  assert.match(validateDataset(dataset).join('\n'), /CPF duplicado/);
});

test('rejeita nota fora do intervalo', () => {
  const dataset = validDataset();
  dataset.candidates[0].score = 110;

  assert.match(validateDataset(dataset).join('\n'), /nota fora do intervalo/);
});

test('rejeita status incompatível com a nota', () => {
  const dataset = validDataset();
  dataset.candidates[0].status = 'LISTA_ESPERA';

  assert.match(validateDataset(dataset).join('\n'), /status .* incompatível/);
});