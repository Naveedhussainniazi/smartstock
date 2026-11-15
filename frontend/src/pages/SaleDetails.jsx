
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { ArrowLeft, Printer, RefreshCw } from "lucide-react";

import {
  fetchSaleById,
  clearSaleDetails,
} from "../features/sales/salesSlice";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

function SaleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const shouldPrint = searchParams.get("print") === "true";

  const {
    saleDetails,
    fetchSaleLoading,
    fetchSaleError,
  } = useSelector((state) => state.sales);

  // FETCH SALE DETAILS
  useEffect(() => {
    dispatch(fetchSaleById(id));

    return () => {
      dispatch(clearSaleDetails());
    };
  }, [dispatch, id]);

  // AUTOMATIC PRINT PREVIEW
  useEffect(() => {
    if (!shouldPrint || fetchSaleLoading || !saleDetails) {
      return;
    }

    const timer = setTimeout(() => {
      window.print();
    }, 700);

    return () => clearTimeout(timer);
  }, [shouldPrint, fetchSaleLoading, saleDetails]);

  // LOADING STATE
  if (fetchSaleLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <RefreshCw
          className="mx-auto animate-spin text-blue-600"
          size={28}
        />

        <p className="mt-3 text-sm text-slate-500">
          Loading invoice details...
        </p>
      </div>
    );
  }

  // ERROR STATE
  if (fetchSaleError || !saleDetails) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <p className="font-medium text-red-600">
          {fetchSaleError || "Sale not found"}
        </p>

        <button
          onClick={() => navigate("/sales")}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Back to Sales
        </button>
      </div>
    );
  }

  const sale = saleDetails;
  const customer = sale.customer;

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <div>
          <button
            onClick={() => navigate("/sales")}
            className="mb-3 flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back to Sales
          </button>

          <h1 className="text-2xl font-bold text-slate-800">
            Invoice Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View complete sales invoice information.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Printer size={18} />
          Print Invoice
        </button>
      </div>

      {/* INVOICE CONTENT */}
      <div
        id="invoice-content"
        className="space-y-6"
      >
        {/* INVOICE INFORMATION */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                SMARTSTOCK
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Inventory Management System
              </p>

              <p className="mt-5 text-sm text-slate-500">
                Invoice Number
              </p>

              <h2 className="mt-1 text-xl font-bold text-blue-600 print:text-black">
                {sale.invoiceNumber}
              </h2>
            </div>

            <div className="flex gap-3">
              <span
                className={`h-fit rounded-full px-3 py-1 text-xs font-semibold capitalize print:border print:border-slate-400 print:bg-white print:text-black ${
                  sale.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : sale.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {sale.status}
              </span>

              <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700 print:border print:border-slate-400 print:bg-white print:text-black">
                {sale.paymentStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">
                Invoice Date
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {new Date(sale.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Created By
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {sale.createdBy?.name || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Payment Method
              </p>

              <p className="mt-1 font-medium capitalize text-slate-800">
                {sale.paymentMethod?.replace("_", " ") || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* CUSTOMER INFORMATION */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <h2 className="mb-4 font-semibold text-slate-800">
            Customer Information
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">
                Customer Name
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {customer?.name || sale.customerName || "Walk-in Customer"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Phone
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {customer?.phone || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Email
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {customer?.email || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Company
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {customer?.company || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                City
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {customer?.city || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Address
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {customer?.address || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* PRODUCTS TABLE */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <div className="border-b border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800">
              Invoice Products
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 print:bg-slate-100">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Unit Price</th>
                  <th className="px-5 py-3">Line Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sale.items?.map((item, index) => (
                  <tr key={`${item.product?._id || item.sku}-${index}`}>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {item.name}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {item.sku}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {item.quantity}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatCurrency(item.unitPrice)}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-800">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* INVOICE TOTALS */}
        <div className="flex justify-end">
          <div className="w-full space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:max-w-md print:rounded-none print:border-0 print:shadow-none">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600">
              <span>Discount</span>
              <span>{formatCurrency(sale.discount)}</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600">
              <span>Tax ({sale.taxRate || 0}%)</span>
              <span>{formatCurrency(sale.taxAmount)}</span>
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-800">
              <span>Grand Total</span>
              <span>{formatCurrency(sale.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* COMPLETION INFORMATION */}
        {sale.completedAt && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 print:border-slate-300 print:bg-white">
            <h2 className="font-semibold text-green-800 print:text-black">
              Sale Completion Information
            </h2>

            <p className="mt-2 text-sm text-green-700 print:text-black">
              Completed on: {new Date(sale.completedAt).toLocaleString()}
            </p>

            <p className="mt-1 text-sm text-green-700 print:text-black">
              Completed by: {sale.completedBy?.name || "N/A"}
            </p>
          </div>
        )}

        {/* INVOICE FOOTER */}
        <div className="border-t border-slate-200 py-5 text-center text-sm text-slate-500">
          <p>Thank you for your business!</p>
          <p className="mt-1">Generated by SmartStock Inventory Management System</p>
        </div>
      </div>

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #invoice-content {
            width: 100%;
          }

          #invoice-content table {
            width: 100%;
            border-collapse: collapse;
          }

          #invoice-content th,
          #invoice-content td {
            border-bottom: 1px solid #e2e8f0;
          }

          #invoice-content tr {
            break-inside: avoid;
          }

          button,
          aside,
          nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default SaleDetails;
