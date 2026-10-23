
const fs = require('node:fs');
const path = require('node:path');
const { validateDataset } = require('./validateCandidates');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function summarize(dataset) {
  const candidates = dataset.candidates;

  return {
    total: candidates.length,
    approved: candidates.filter(
      (candidate) => candidate.status === 'APROVADO'
    ).length,
    waiting: candidates.filter(
      (candidate) => candidate.status === 'LISTA_ESPERA'
    ).length
  };
}

function main() {
  const dataset = loadJson('data/candidatos.json');
  const errors = validateDataset(dataset);

  if (errors.length > 0) {
    throw new Error(
      `build interrompido: ${errors.length} erro(s) de dados`
    );
  }

  const summary = summarize(dataset);

  const approved = dataset.candidates
    .filter((candidate) => candidate.status === 'APROVADO')
    .map(({ registration, name, score }) => ({
      registration,
      name,
      score
    }));

  ensureDir('dist');

  fs.copyFileSync(
    'public/index.html',
    path.join('dist', 'index.html')
  );

  const report = {
    process: dataset.metadata.processo,
    version: dataset.metadata.version,
    generatedAt: new Date().toISOString(),
    summary,
    approved
  };

  fs.writeFileSync(
    'dist/relatorio.json',
    `${JSON.stringify(report, null, 2)}\n`
  );

  console.log(
    `RELATÓRIO GERADO: ${approved.length} aprovados de ${summary.total} candidatos`
  );
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
