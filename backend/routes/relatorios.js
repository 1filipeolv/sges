const express = require('express');
const ExcelJS = require('exceljs');
const { pool } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/excel', auth, async (req, res) => {
  const { de, ate, pessoa_id } = req.query;
  if (!de || !ate) return res.status(400).json({ error: 'Informe data de início e fim' });

  try {
    const params = [de, ate + ' 23:59:59'];
    let filtro = '';
    if (pessoa_id) { params.push(pessoa_id); filtro = ` AND m.pessoa_id = $${params.length}`; }

    const movResult = await pool.query(`
      SELECT
        e.patrimonio, e.tipo, e.numero, e.descricao,
        p.nome as pessoa_nome, p.funcao as pessoa_funcao,
        m.data_retirada, me.data_devolucao,
        CASE WHEN me.data_devolucao IS NOT NULL
          THEN ROUND(EXTRACT(EPOCH FROM (me.data_devolucao - m.data_retirada)))
          ELSE NULL
        END as duracao_segundos
      FROM movimentacao_equipamentos me
      JOIN movimentacoes m ON m.id = me.movimentacao_id
      JOIN equipamentos e ON e.id = me.equipamento_id
      JOIN pessoas p ON p.id = m.pessoa_id
      WHERE m.data_retirada >= $1 AND m.data_retirada <= $2 ${filtro}
      ORDER BY m.data_retirada DESC
    `, params);

    // Resumo — equipamentos mais usados
    const topEq = await pool.query(`
      SELECT e.tipo, e.numero, e.patrimonio, COUNT(*) as total
      FROM movimentacao_equipamentos me
      JOIN movimentacoes m ON m.id = me.movimentacao_id
      JOIN equipamentos e ON e.id = me.equipamento_id
      WHERE m.data_retirada >= $1 AND m.data_retirada <= $2 ${filtro}
      GROUP BY e.id ORDER BY total DESC LIMIT 10
    `, params);

    // Resumo — pessoas que mais retiraram
    const topPessoas = await pool.query(`
      SELECT p.nome, p.funcao, COUNT(*) as total
      FROM movimentacao_equipamentos me
      JOIN movimentacoes m ON m.id = me.movimentacao_id
      JOIN pessoas p ON p.id = m.pessoa_id
      WHERE m.data_retirada >= $1 AND m.data_retirada <= $2 ${filtro}
      GROUP BY p.id ORDER BY total DESC LIMIT 10
    `, params);

    // Montar Excel
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SGES SESI';
    wb.created = new Date();

    // === ABA 1: Movimentações ===
    const ws1 = wb.addWorksheet('Movimentações');

    // Cabeçalho estilizado
    ws1.mergeCells('A1:I1');
    ws1.getCell('A1').value = `SGES — Relatório de Movimentações | ${de} a ${ate}`;
    ws1.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    ws1.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE30613' } };
    ws1.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getRow(1).height = 40;

    ws1.addRow([]);

    const cols1 = ['Equipamento', 'Número', 'Patrimônio', 'Descrição', 'Pessoa', 'Função', 'Retirada', 'Devolução', 'Duração'];
    const headerRow1 = ws1.addRow(cols1);
    headerRow1.eachCell(cell => {
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE30613' } } };
    });
    ws1.getRow(3).height = 26;

    const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR') : '—';

    const fmtDuracao = (segundos) => {
      if (segundos === null || segundos === undefined) return 'Em uso';
      const s = Number(segundos);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      return `${h}h ${String(m).padStart(2, '0')}min ${String(sec).padStart(2, '0')}s`;
    };

    movResult.rows.forEach((row, i) => {
      const nomeEq = row.numero ? `${row.tipo} ${row.numero}` : row.tipo;
      const r = ws1.addRow([
        nomeEq,
        row.numero || '—',
        row.patrimonio || '—',
        row.descricao || '—',
        row.pessoa_nome,
        row.pessoa_funcao,
        fmtDate(row.data_retirada),
        fmtDate(row.data_devolucao),
        fmtDuracao(row.duracao_segundos),
      ]);
      r.height = 22;
      r.eachCell(cell => {
        cell.font = { size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (i % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
      });
    });

    // Colunas mais largas — principal mudança
    ws1.columns = [
      { width: 28 }, { width: 14 }, { width: 18 }, { width: 32 },
      { width: 32 }, { width: 24 }, { width: 22 }, { width: 22 }, { width: 18 },
    ];

    // Totais
    ws1.addRow([]);
    const totalRow = ws1.addRow([`Total de registros: ${movResult.rows.length}`, '', '', '', '', '', '', '', '']);
    totalRow.getCell(1).font = { bold: true, size: 12 };
    totalRow.height = 22;

    // === ABA 2: Resumo ===
    const ws2 = wb.addWorksheet('Resumo');

    ws2.mergeCells('A1:D1');
    ws2.getCell('A1').value = `SGES — Resumo do Período | ${de} a ${ate}`;
    ws2.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    ws2.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE30613' } };
    ws2.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws2.getRow(1).height = 40;

    ws2.addRow([]);

    // Equipamentos mais usados
    const secEq = ws2.addRow(['EQUIPAMENTOS MAIS USADOS']);
    secEq.getCell(1).font = { bold: true, size: 13 };
    secEq.height = 24;

    const hEq = ws2.addRow(['Equipamento', 'Patrimônio', 'Total de Retiradas']);
    hEq.height = 24;
    hEq.eachCell(cell => {
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF555555' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    topEq.rows.forEach((row, i) => {
      const nomeEq = row.numero ? `${row.tipo} ${row.numero}` : row.tipo;
      const r = ws2.addRow([nomeEq, row.patrimonio || '—', Number(row.total)]);
      r.height = 22;
      r.eachCell(cell => {
        cell.font = { size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (i % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
      });
    });

    ws2.addRow([]);

    // Pessoas que mais retiraram
    const secP = ws2.addRow(['PESSOAS QUE MAIS RETIRARAM']);
    secP.getCell(1).font = { bold: true, size: 13 };
    secP.height = 24;

    const hP = ws2.addRow(['Nome', 'Função', 'Total de Retiradas']);
    hP.height = 24;
    hP.eachCell(cell => {
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF555555' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    topPessoas.rows.forEach((row, i) => {
      const r = ws2.addRow([row.nome, row.funcao, Number(row.total)]);
      r.height = 22;
      r.eachCell(cell => {
        cell.font = { size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (i % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
      });
    });

    // Colunas mais largas — aba Resumo
    ws2.columns = [{ width: 34 }, { width: 24 }, { width: 22 }, { width: 16 }];

    // Enviar arquivo
    const filename = `SGES_Relatorio_${de}_${ate}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;