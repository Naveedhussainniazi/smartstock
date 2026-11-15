
export const exportToCSV = (filename, rows, columns) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    alert("No data available to export.");
    return;
  }

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return "";

    const formattedValue =
      typeof value === "object"
        ? JSON.stringify(value)
        : String(value);

    return `"${formattedValue.replace(/"/g, '""')}"`;
  };

  const headers = columns
    .map((column) => escapeCSV(column.label))
    .join(",");

  const data = rows.map((row) =>
    columns
      .map((column) => {
        const value = column.value
          ? column.value(row)
          : row[column.key];

        return escapeCSV(value);
      })
      .join(",")
  );

  const csvContent = [headers, ...data].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename.endsWith(".csv")
    ? filename
    : `${filename}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};
