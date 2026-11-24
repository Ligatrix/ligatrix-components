// Renders a metric tile and a one-row table. Run: node examples/quick-start.mjs

import { metricTile, badge, dataTable } from "../src/index.mjs";

console.log(metricTile({ label: "Open orders", value: 1284, delta: 6.4, period: "vs last week" }));

console.log(
  dataTable({
    caption: "Purchase orders",
    sort: { key: "value", direction: "descending" },
    columns: [
      { key: "id", label: "Order", rowHeader: true },
      { key: "status", label: "Status", render: (v) => badge({ label: v, status: "warning" }) },
      { key: "value", label: "Value", numeric: true, sortable: true, format: (v) => `$${v.toLocaleString("en-US")}` },
    ],
    rows: [{ id: "PO-10475", status: "On hold", value: 61200 }],
  }),
);
