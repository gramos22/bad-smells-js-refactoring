const REPORT_TYPES = Object.freeze({
  CSV: 'CSV',
  HTML: 'HTML',
});

const USER_ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  USER: 'USER',
});

const USER_ITEM_VALUE_LIMIT = 500;
const PRIORITY_VALUE_THRESHOLD = 1000;

export class ReportGenerator {
  constructor() {}

  generateReport(reportType, user, items) {
    const safeItems = Array.isArray(items) ? items : [];
    const visibleItems = this.filterItemsByRole(user, safeItems);
    const total = this.calculateTotal(visibleItems);
    const builder = this.getBuilder(reportType);

    return builder({
      user,
      items: visibleItems,
      total,
      highlight: (item) => this.shouldHighlight(item, user),
    }).trim();
  }

  filterItemsByRole(user, items) {
    const role = user?.role;

    if (role === USER_ROLES.ADMIN) {
      return items;
    }

    if (role === USER_ROLES.USER) {
      return items.filter((item) => item.value <= USER_ITEM_VALUE_LIMIT);
    }

    return [];
  }

  calculateTotal(items) {
    return items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  }

  shouldHighlight(item, user) {
    return user?.role === USER_ROLES.ADMIN && Number(item.value) > PRIORITY_VALUE_THRESHOLD;
  }

  getBuilder(reportType) {
    switch (reportType) {
      case REPORT_TYPES.CSV:
        return (params) => this.buildCsvReport(params);
      case REPORT_TYPES.HTML:
        return (params) => this.buildHtmlReport(params);
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  buildCsvReport({ user, items, total }) {
    const lines = [
      'ID,NOME,VALOR,USUARIO',
      ...items.map((item) => `${item.id},${item.name},${item.value},${user.name}`),
      '',
      'Total,,',
      `${total},,`,
    ];

    return lines.join('\n');
  }

  buildHtmlReport({ user, items, total, highlight }) {
    const header = [
      '<html><body>',
      '<h1>Relatório</h1>',
      `<h2>Usuário: ${user.name}</h2>`,
      '<table>',
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>',
    ];

    const rows = items.map((item) => {
      const style = highlight?.(item) ? ' style="font-weight:bold;"' : '';
      return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>`;
    });

    const footer = [
      '</table>',
      `<h3>Total: ${total}</h3>`,
      '</body></html>',
    ];

    return [...header, ...rows, ...footer].join('\n');
  }
}