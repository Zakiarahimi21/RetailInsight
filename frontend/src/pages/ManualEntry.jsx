import { useState } from "react";
import "../styles/data.css";
import TransactionsTab from "./manual-entry/TransactionsTab";
import ProductsTab from "./manual-entry/ProductsTab";
import CustomersTab from "./manual-entry/CustomersTab";
import CategoriesTab from "./manual-entry/CategoriesTab";

const TABS = [
  { key: "transactions", label: "Transactions", Component: TransactionsTab },
  { key: "products", label: "Products", Component: ProductsTab },
  { key: "customers", label: "Customers", Component: CustomersTab },
  { key: "categories", label: "Categories", Component: CategoriesTab },
];

export default function ManualEntry() {
  const [active, setActive] = useState("transactions");
  const ActiveComponent = TABS.find((t) => t.key === active).Component;

  return (
    <>
      <div className="ri-page-header">
        <h1>Manual Entry</h1>
        <p>Add and manage transactions, products, customers, and categories directly.</p>
      </div>

      <div className="ri-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`ri-tab${active === t.key ? " active" : ""}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </>
  );
}
