
/********************************************************************
 * receipt.js — Complete Receipt System
 * Features:
 * 1. Open Receipt
 * 2. Download Receipt as JPG
 * 3. Print / Save as PDF
 * 4. Logo and image handling
 * 5. Mobile-friendly receipt layout
 * 6. Original receipt content is not modified during JPG download
 ********************************************************************/

(function () {
  "use strict";

  /* =========================================================
     CONFIGURATION
  ========================================================= */

  const RECEIPT_CONFIG = {
    organizationName: "MADRASA FAIZAN-E-MUSTAFA",
    organizationUrdu: "مدرسہ فیضان مصطفیٰ",
    logo: "",
    currency: "₹",
    filePrefix: "Receipt",
    imageScale: 2,
    background: "#ffffff",
    primaryColor: "#123b73",
    secondaryColor: "#16834a",
    goldColor: "#c69b35"
  };

  /* =========================================================
     LOAD HTML2CANVAS
  ========================================================= */

  let html2CanvasPromise = null;

  function loadHtml2Canvas() {
    if (window.html2canvas) {
      return Promise.resolve(window.html2canvas);
    }

    if (html2CanvasPromise) {
      return html2CanvasPromise;
    }

    html2CanvasPromise = new Promise(function (resolve, reject) {
      const existing = document.getElementById("receipt-html2canvas");

      if (existing) {
        existing.addEventListener("load", function () {
          if (window.html2canvas) {
            resolve(window.html2canvas);
          } else {
            reject(new Error("HTML2Canvas load nahi hua."));
          }
        }, { once: true });

        existing.addEventListener("error", function () {
          reject(new Error("HTML2Canvas load karne mein error."));
        }, { once: true });

        if (window.html2canvas) {
          resolve(window.html2canvas);
        }

        return;
      }

      const script = document.createElement("script");
      script.id = "receipt-html2canvas";
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.async = true;

      script.onload = function () {
        if (window.html2canvas) {
          resolve(window.html2canvas);
        } else {
          reject(new Error("HTML2Canvas available nahi hai."));
        }
      };

      script.onerror = function () {
        reject(new Error("HTML2Canvas download nahi ho saka."));
      };

      document.head.appendChild(script);
    });

    return html2CanvasPromise;
  }

  /* =========================================================
     HELPERS
  ========================================================= */

  function safeText(value, fallback) {
    if (value === undefined || value === null || value === "") {
      return fallback || "";
    }

    return String(value);
  }

  function escapeHtml(value) {
    const text = safeText(value);

    if (typeof window.esc === "function") {
      return window.esc(text);
    }

    return text.replace(/[&<>"']/g, function (character) {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return entities[character];
    });
  }

  function formatMoney(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return RECEIPT_CONFIG.currency + "0";
    }

    if (typeof window.inr === "function") {
      try {
        return window.inr(amount);
      } catch (error) {
        // Default formatting is used below.
      }
    }

    return RECEIPT_CONFIG.currency +
      amount.toLocaleString("en-IN", {
        maximumFractionDigits: 2
      });
  }

  function formatDate(value) {
    if (!value) {
      return new Date().toLocaleDateString("en-IN");
    }

    let date;

    if (value.toDate && typeof value.toDate === "function") {
      date = value.toDate();
    } else if (value.seconds) {
      date = new Date(value.seconds * 1000);
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
      return safeText(value);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function notify(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }

    if (typeof window.toast === "function") {
      window.toast(message);
      return;
    }

    let toast = document.getElementById("receipt-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "receipt-toast";

      Object.assign(toast.style, {
        position: "fixed",
        left: "50%",
        bottom: "24px",
        transform: "translateX(-50%)",
        zIndex: "999999",
        background: "#172033",
        color: "#fff",
        padding: "12px 18px",
        borderRadius: "10px",
        fontSize: "14px",
        maxWidth: "90%",
        textAlign: "center",
        boxShadow: "0 5px 20px #0002"
      });

      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.display = "block";

    clearTimeout(toast._hideTimer);

    toast._hideTimer = setTimeout(function () {
      toast.style.display = "none";
    }, 2800);
  }

  function normalizeLogoUrl(url) {
    if (!url) return "";

    let result = String(url).trim();

    const driveMatch = result.match(
      /drive\.google\.com\/file\/d\/([^/?#]+)/
    );

    if (driveMatch) {
      result =
        "https://drive.google.com/uc?export=view&id=" +
        encodeURIComponent(driveMatch[1]);
    }

    const openMatch = result.match(
      /drive\.google\.com\/open\?id=([^&#]+)/
    );

    if (openMatch) {
      result =
        "https://drive.google.com/uc?export=view&id=" +
        encodeURIComponent(openMatch[1]);
    }

    return result;
  }

  function getLogo() {
    const organization = window.org || window.ORG || {};

    return normalizeLogoUrl(
      organization.logo ||
      organization.logoUrl ||
      organization.photoURL ||
      RECEIPT_CONFIG.logo ||
      ""
    );
  }

  function getOrganizationName() {
    const organization = window.org || window.ORG || {};

    return safeText(
      organization.name ||
      organization.orgName ||
      organization.title,
      RECEIPT_CONFIG.organizationName
    );
  }

  function getCurrentUser() {
    return window.ME || window.currentUser || {};
  }

  function getUserName(user) {
    return safeText(
      user.name ||
      user.fullName ||
      user.displayName ||
      user.userName,
      "Member"
    );
  }

  function getUserId(user) {
    return safeText(
      user.userId ||
      user.uid ||
      user.id ||
      user.memberId,
      "—"
    );
  }

  function waitForImages(element) {
    const images = Array.from(element.querySelectorAll("img"));

    return Promise.all(images.map(function (image) {
      if (image.complete && image.naturalWidth > 0) {
        return Promise.resolve();
      }

      return new Promise(function (resolve) {
        image.onload = resolve;
        image.onerror = resolve;

        setTimeout(resolve, 5000);
      });
    }));
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 2000);
  }

  function makeSafeFilename(value) {
    return safeText(value, "receipt")
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 80);
  }

  /* =========================================================
     RECEIPT CSS
  ========================================================= */

  function injectReceiptStyles() {
    if (document.getElementById("receipt-system-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "receipt-system-styles";

    style.textContent = `
      .receipt-overlay {
        position: fixed;
        inset: 0;
        z-index: 999990;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        overflow-y: auto;
        padding: 18px 10px;
        background: rgba(10, 20, 35, .68);
        backdrop-filter: blur(5px);
      }

      .receipt-dialog {
        width: 100%;
        max-width: 520px;
        margin: auto;
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 12px 45px rgba(0,0,0,.22);
        overflow: hidden;
      }

      .receipt-actions {
        position: sticky;
        top: 0;
        z-index: 5;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px;
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
      }

      .receipt-action-btn {
        flex: 1;
        min-width: 100px;
        padding: 11px 10px;
        border: 0;
        border-radius: 8px;
        color: #fff;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
      }

      .receipt-action-download {
        background: #16834a;
      }

      .receipt-action-print {
        background: #123b73;
      }

      .receipt-action-close {
        background: #596273;
      }

      .receipt-paper {
        width: 100%;
        padding: 24px 20px;
        background: #fff;
        color: #172033;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
      }

      .receipt-paper *,
      .receipt-paper *::before,
      .receipt-paper *::after {
        box-sizing: border-box;
      }

      .receipt-header {
        text-align: center;
        padding-bottom: 16px;
        border-bottom: 2px solid #123b73;
      }

      .receipt-logo {
        display: block;
        width: 74px;
        height: 74px;
        object-fit: contain;
        margin: 0 auto 8px;
      }

      .receipt-org-urdu {
        font-size: 22px;
        font-weight: 700;
        line-height: 1.5;
        color: #123b73;
      }

      .receipt-org-name {
        margin-top: 3px;
        font-size: 17px;
        font-weight: 800;
        line-height: 1.4;
        color: #123b73;
        overflow-wrap: anywhere;
      }

      .receipt-subtitle {
        margin-top: 5px;
        font-size: 11px;
        letter-spacing: 2px;
        color: #16834a;
        font-weight: 800;
      }

      .receipt-title {
        margin: 17px auto 12px;
        width: fit-content;
        padding: 7px 22px;
        border: 1px solid #c69b35;
        border-radius: 30px;
        color: #123b73;
        font-size: 15px;
        font-weight: 800;
      }

      .receipt-meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin: 12px 0 16px;
      }

      .receipt-meta-item {
        padding: 10px;
        border-radius: 7px;
        background: #f4f7fb;
        min-width: 0;
      }

      .receipt-label {
        margin-bottom: 4px;
        font-size: 10px;
        font-weight: 700;
        color: #697386;
        text-transform: uppercase;
      }

      .receipt-value {
        font-size: 13px;
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      .receipt-table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0 15px;
      }

      .receipt-table th {
        padding: 10px 8px;
        background: #123b73;
        color: #fff;
        font-size: 11px;
        text-align: left;
      }

      .receipt-table td {
        padding: 11px 8px;
        border: 1px solid #e2e7ef;
        font-size: 12px;
        overflow-wrap: anywhere;
      }

      .receipt-table th:last-child,
      .receipt-table td:last-child {
        text-align: right;
      }

      .receipt-total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 12px;
        padding: 14px;
        border-radius: 8px;
        background: #eaf6ee;
        color: #12683a;
        font-size: 14px;
        font-weight: 800;
      }

      .receipt-words {
        margin-top: 12px;
        padding: 11px;
        border: 1px dashed #cbd5e1;
        border-radius: 7px;
        font-size: 11px;
        line-height: 1.6;
        overflow-wrap: anywhere;
      }

      .receipt-note {
        margin-top: 18px;
        text-align: center;
        font-size: 11px;
        line-height: 1.7;
        color: #596273;
      }

      .receipt-signature {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        margin-top: 35px;
      }

      .receipt-signature div {
        width: 48%;
        padding-top: 7px;
        border-top: 1px solid #8993a4;
        text-align: center;
        font-size: 10px;
        font-weight: 700;
      }

      @media (max-width: 420px) {
        .receipt-overlay {
          padding: 6px;
        }

        .receipt-paper {
          padding: 18px 12px;
        }

        .receipt-org-name {
          font-size: 15px;
        }

        .receipt-org-urdu {
          font-size: 20px;
        }

        .receipt-meta {
          gap: 7px;
        }

        .receipt-meta-item {
          padding: 8px;
        }

        .receipt-table th,
        .receipt-table td {
          padding: 8px 5px;
          font-size: 11px;
        }
      }

      @media print {
        body.receipt-printing * {
          visibility: hidden !important;
        }

        body.receipt-printing #receipt-print-area,
        body.receipt-printing #receipt-print-area * {
          visibility: visible !important;
        }

        body.receipt-printing #receipt-print-area {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          overflow: visible !important;
          background: #fff !important;
        }

        body.receipt-printing .receipt-actions {
          display: none !important;
        }

        body.receipt-printing .receipt-paper {
          width: 100% !important;
          padding: 10mm !important;
          box-shadow: none !important;
        }

        @page {
          size: A4;
          margin: 8mm;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* =========================================================
     RECEIPT DATA
  ========================================================= */

  function findReceiptData(id) {
    const collections = [
      window.RECEIPTS,
      window.receipts,
      window.PAYMENTS,
      window.payments,
      window.transactions,
      window.paymentHistory
    ];

    for (const collection of collections) {
      if (Array.isArray(collection)) {
        const found = collection.find(function (item) {
          return String(
            item.id ||
            item.receiptId ||
            item.paymentId ||
            item.key ||
            ""
          ) === String(id);
        });

        if (found) return found;
      }

      if (collection && typeof collection === "object" &&
          !Array.isArray(collection)) {
        if (collection[id]) return collection[id];
      }
    }

    return null;
  }

  function getReceiptAmount(data) {
    return Number(
      data.amount ??
      data.paidAmount ??
      data.paymentAmount ??
      data.total ??
      data.value ??
      0
    ) || 0;
  }

  function getReceiptNumber(id, data) {
    return safeText(
      data.receiptNo ||
      data.receiptNumber ||
      data.voucherNo ||
      data.transactionId ||
      data.paymentId ||
      id,
      "—"
    );
  }

  function getReceiptDate(data) {
    return formatDate(
      data.date ||
      data.paymentDate ||
      data.createdAt ||
      data.timestamp ||
      new Date()
    );
  }

  function getPaymentMethod(data) {
    return safeText(
      data.method ||
      data.paymentMethod ||
      data.mode ||
      data.paymentMode,
      "Cash"
    );
  }

  function getMemberData(data) {
    const currentUser = getCurrentUser();

    return data.user ||
      data.member ||
      data.userData ||
      data.memberData ||
      currentUser;
  }

  /* =========================================================
     BUILD RECEIPT HTML
  ========================================================= */

  function buildReceiptHtml(id, data) {
    const organizationName = getOrganizationName();
    const logo = getLogo();
    const member = getMemberData(data);
    const amount = getReceiptAmount(data);
    const receiptNo = getReceiptNumber(id, data);
    const date = getReceiptDate(data);

    const memberName = getUserName(member);
    const memberId = getUserId(member);

    const fatherName = safeText(
      member.fatherName ||
      member.father ||
      member.guardianName,
      "—"
    );

    const phone = safeText(
      member.mobile ||
      member.phone ||
      member.phoneNumber,
      "—"
    );

    const purpose = safeText(
      data.purpose ||
      data.description ||
      data.for ||
      data.category,
      "Subscription / Contribution"
    );

    const method = getPaymentMethod(data);

    const previousDue = Number(
      data.previousDue ||
      data.oldDue ||
      data.dueBefore ||
      0
    ) || 0;

    const remainingDue = Number(
      data.remainingDue ??
      data.dueAfter ??
      data.balanceDue ??
      data.dueAmount ??
      0
    ) || 0;

    const logoHtml = logo
      ? '<img class="receipt-logo" src="' +
        escapeHtml(logo) +
        '" crossorigin="anonymous" alt="Organization Logo">'
      : "";

    return `
      <div class="receipt-paper" id="receipt-paper">
        <header class="receipt-header">
          ${logoHtml}
          <div class="receipt-org-urdu">
            ${escapeHtml(RECEIPT_CONFIG.organizationUrdu)}
          </div>
          <div class="receipt-org-name">
            ${escapeHtml(organizationName)}
          </div>
          <div class="receipt-subtitle">OFFICIAL PAYMENT RECEIPT</div>
        </header>

        <div class="receipt-title">PAYMENT RECEIPT</div>

        <div class="receipt-meta">
          <div class="receipt-meta-item">
            <div class="receipt-label">Receipt Number</div>
            <div class="receipt-value">${escapeHtml(receiptNo)}</div>
          </div>

          <div class="receipt-meta-item">
            <div class="receipt-label">Payment Date</div>
            <div class="receipt-value">${escapeHtml(date)}</div>
          </div>

          <div class="receipt-meta-item">
            <div class="receipt-label">Member Name</div>
            <div class="receipt-value">${escapeHtml(memberName)}</div>
          </div>

          <div class="receipt-meta-item">
            <div class="receipt-label">Member ID</div>
            <div class="receipt-value">${escapeHtml(memberId)}</div>
          </div>

          <div class="receipt-meta-item">
            <div class="receipt-label">Father's Name</div>
            <div class="receipt-value">${escapeHtml(fatherName)}</div>
          </div>

          <div class="receipt-meta-item">
            <div class="receipt-label">Mobile Number</div>
            <div class="receipt-value">${escapeHtml(phone)}</div>
          </div>
        </div>

        <table class="receipt-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Payment Mode</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${escapeHtml(purpose)}</td>
              <td>${escapeHtml(method)}</td>
              <td>${escapeHtml(formatMoney(amount))}</td>
            </tr>
          </tbody>
        </table>

        <div class="receipt-total">
          <span>Total Received</span>
          <span>${escapeHtml(formatMoney(amount))}</span>
        </div>

        <div class="receipt-words">
          <strong>Previous Due:</strong>
          ${escapeHtml(formatMoney(previousDue))}
          <br>
          <strong>Due Balance:</strong>
          ${escapeHtml(formatMoney(remainingDue))}
        </div>

        <div class="receipt-note">
          Thank you for your contribution.
          <br>
          Please keep this receipt for your records.
          <br>
          This is a computer-generated receipt.
        </div>

        <div class="receipt-signature">
          <div>Received By</div>
          <div>Authorized Signature</div>
        </div>
      </div>
    `;
  }

  /* =========================================================
     OPEN RECEIPT
  ========================================================= */

  function openReceipt(id) {
    injectReceiptStyles();

    const data = findReceiptData(id);

    if (!data) {
      notify(
        "Receipt data nahi mila. Check karein ki payment record available hai."
      );
      return;
    }

    const previous = document.getElementById("receipt-overlay");

    if (previous) previous.remove();

    const overlay = document.createElement("div");
    overlay.id = "receipt-overlay";
    overlay.className = "receipt-overlay";

    overlay.innerHTML = `
      <div class="receipt-dialog" role="dialog"
           aria-modal="true" aria-label="Payment Receipt">

        <div class="receipt-actions">
          <button type="button"
                  class="receipt-action-btn receipt-action-download"
                  id="receipt-download-btn">
            Download JPG
          </button>

          <button type="button"
                  class="receipt-action-btn receipt-action-print"
                  id="receipt-print-btn">
            Print / PDF
          </button>

          <button type="button"
                  class="receipt-action-btn receipt-action-close"
                  id="receipt-close-btn">
            Close
          </button>
        </div>

        <div id="receipt-print-area">
          ${buildReceiptHtml(id, data)}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        overlay.remove();
      }
    });

    overlay.querySelector("#receipt-close-btn")
      .addEventListener("click", function () {
        overlay.remove();
      });

    overlay.querySelector("#receipt-download-btn")
      .addEventListener("click", function () {
        downloadReceiptJpg(this);
      });

    overlay.querySelector("#receipt-print-btn")
      .addEventListener("click", function () {
        printReceipt();
      });

    document.addEventListener("keydown", function closeOnEscape(event) {
      if (event.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", closeOnEscape);
      }
    });
  }

  /* =========================================================
     DOWNLOAD RECEIPT AS JPG
  ========================================================= */

  async function downloadReceiptJpg(button) {
    const receipt = document.getElementById("receipt-paper");

    if (!receipt) {
      notify("Receipt nahi mila.");
      return;
    }

    const originalText = button ? button.textContent : "";

    try {
      if (button) {
        button.disabled = true;
        button.textContent = "Preparing JPG...";
      }

      await loadHtml2Canvas();
      await waitForImages(receipt);

      const canvas = await window.html2canvas(receipt, {
        scale: RECEIPT_CONFIG.imageScale,
        backgroundColor: RECEIPT_CONFIG.background,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 10000,
        scrollX: 0,
        scrollY: 0
      });

      const data = findReceiptData(
        (function () {
          const number = document.querySelector(
            "#receipt-paper .receipt-meta-item .receipt-value"
          );

          return number ? number.textContent.trim() : "receipt";
        })()
      );

      const filename = makeSafeFilename(
        RECEIPT_CONFIG.filePrefix + "-" +
        (data ? getReceiptNumber("", data) : "download")
      ) + ".jpg";

      const blob = await new Promise(function (resolve) {
        canvas.toBlob(resolve, "image/jpeg", 0.95);
      });

      if (blob) {
        downloadBlob(blob, filename);
      } else {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/jpeg", 0.95);
        link.download = filename;
        link.click();
      }

      notify("Receipt JPG download shuru ho gaya.");
    } catch (error) {
      console.error("Receipt JPG error:", error);
      notify(
        "JPG nahi ban saka. Logo ya image ke CORS issue ko check karein."
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText || "Download JPG";
      }
    }
  }

  /* =========================================================
     PRINT / SAVE AS PDF
  ========================================================= */

  function printReceipt() {
    const receipt = document.getElementById("receipt-print-area");

    if (!receipt) {
      notify("Print karne ke liye receipt nahi mili.");
      return;
    }

    document.body.classList.add("receipt-printing");

    const cleanup = function () {
      document.body.classList.remove("receipt-printing");
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);

    setTimeout(function () {
      window.print();

      setTimeout(cleanup, 1500);
    }, 200);
  }

  /* =========================================================
     OPTIONAL: OPEN RECEIPT FROM BUTTON
     Example:
     <button onclick="openReceipt('PAYMENT_ID')">Receipt</button>
  ========================================================= */

  document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-open-receipt]");

    if (!button) return;

    const id = button.getAttribute("data-open-receipt");

    if (id) {
      openReceipt(id);
    }
  });

  /* =========================================================
     PUBLIC FUNCTIONS
  ========================================================= */

  window.openReceipt = openReceipt;
  window.downloadReceiptJpg = downloadReceiptJpg;
  window.printReceipt = printReceipt;

})();
