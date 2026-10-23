const fs = require('node:fs');

function validateCandidate(candidate, index, minimumScore) {
  const errors = [];
  const required = ['registration', 'cpf', 'name', 'score', 'status'];

  for (const field of required) {
    if (
      candidate[field] === undefined ||
      candidate[field] === null ||
      candidate[field] === ''
    ) {
      errors.push(
        `registro ${index + 1}: campo obrigatório ausente: ${field}`
      );
    }
  }

  if (!/^\d{11}$/.test(String(candidate.cpf ?? ''))) {
    errors.push(
      `registro ${index + 1}: CPF deve conter exatamente 11 dígitos`
    );
  }

  if (
    !Number.isFinite(candidate.score) ||
    candidate.score < 0 ||
    candidate.score > 100
  ) {
    errors.push(
      `registro ${index + 1}: nota fora do intervalo 0..100`
    );
  }

  const expectedStatus =
    candidate.score >= minimumScore ? 'APROVADO' : 'LISTA_ESPERA';

  if (
    candidate.status !== undefined &&
    candidate.status !== null &&
    candidate.status !== '' &&
    candidate.status !== expectedStatus
  ) {
    errors.push(
      `registro ${index + 1}: status ${candidate.status} incompatível com nota ${candidate.score}; esperado ${expectedStatus}`
    );
  }

  return errors;
}

function validateDataset(dataset) {
  const errors = [];

  if (
    !dataset.metadata ||
    typeof dataset.metadata !== 'object' ||
    Array.isArray(dataset.metadata)
  ) {
    errors.push('metadata ausente ou inválido');
    return errors;
  }

  if (
    !Array.isArray(dataset.candidates) ||
    dataset.candidates.length === 0
  ) {
    errors.push('lista candidates ausente ou vazia');
    return errors;
  }

  const minimumScore = Number(dataset.metadata.minimumScore);

  if (
    !Number.isFinite(minimumScore) ||
    minimumScore < 0 ||
    minimumScore > 100
  ) {
    errors.push('metadata.minimumScore inválido');
    return errors;
  }

  const cpfs = new Set();
  const registrations = new Set();

  dataset.candidates.forEach((candidate, index) => {
    if (
      !candidate ||
      typeof candidate !== 'object' ||
      Array.isArray(candidate)
    ) {
      errors.push(`registro ${index + 1}: candidato inválido`);
      return;
    }

    errors.push(
      ...validateCandidate(candidate, index, minimumScore)
    );

    const cpf = candidate.cpf;
    const registration = candidate.registration;

    if (cpf !== undefined && cpf !== null && cpf !== '') {
      if (cpfs.has(cpf)) {
        errors.push(
          `registro ${index + 1}: CPF duplicado: ${cpf}`
        );
      }

      cpfs.add(cpf);
    }

    if (
      registration !== undefined &&
      registration !== null &&
      registration !== ''
    ) {
      if (registrations.has(registration)) {
        errors.push(
          `registro ${index + 1}: inscrição duplicada: ${registration}`
        );
      }

      registrations.add(registration);
    }
  });

  return errors;
}

function main() {
  const filePath = process.argv[2] || 'data/candidatos.json';

  let dataset;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    dataset = JSON.parse(content);
  } catch (error) {
    console.error(`Erro ao ler os dados: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const errors = validateDataset(dataset);

  if (errors.length > 0) {
    console.error('Validação dos candidatos falhou:');

    for (const error of errors) {
      console.error(`- ${error}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log('Validação dos candidatos concluída com sucesso!');
  console.log(`Total de candidatos: ${dataset.candidates.length}`);
}

module.exports = {
  validateCandidate,
  validateDataset
};

if (require.main === module) {
  main();
}