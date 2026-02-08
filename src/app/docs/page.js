"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import contents from "@/data/contents.json";
import business from "@/data/business.json";
import brandLogo from "@/app/brand.png";
import styles from "./page.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const createItem = (id) => ({ id, description: "", quantity: 1, price: 0 });

export default function DocsPage() {
	const [docType, setDocType] = useState("quotation");
	const [customerName, setCustomerName] = useState("");
	const [customerId, setCustomerId] = useState("-");
	const [customerTitle, setCustomerTitle] = useState("");
	const [showSuggestions, setShowSuggestions] = useState(false);
	const customerAutocompleteRef = useRef(null);
	const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
	const nextItemId = useRef(1);
	const [items, setItems] = useState([createItem(0)]);
	const [showItemSuggestions, setShowItemSuggestions] = useState({});
	const [docSuffix, setDocSuffix] = useState("A1");
	const [suffixOptions, setSuffixOptions] = useState(["A1"]);
	const [invoiceData, setInvoiceData] = useState(null);
	const [invoiceFileName, setInvoiceFileName] = useState("");
	const [downpaymentType, setDownpaymentType] = useState("percentage");
	const [downpaymentValue, setDownpaymentValue] = useState(50);
	const [clientIdInput, setClientIdInput] = useState("");

	const formatTitlePrefix = (title) => {
		const titleMap = {
			architect: "ARCH.",
			engineer: "ENGR.",
			mister: "MR.",
			misuss: "MRS.",
			doctor: "DR.",
			miss: "MS."
		};
		return titleMap[title?.toLowerCase()] || "";
	};

	const formatLongDate = (dateString) => {
		if (!dateString) return "";
		const date = new Date(dateString);
		const months = [
			"January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December"
		];
		return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
	};

	const formatCustomerDisplay = (customer) => {
		if (typeof customer.name === "string") return customer.name;
		const fullName = `${customer.name.first || ""} ${customer.name.last || ""}`.trim();
		return fullName || "";
	};

	const formatCustomerWithTitle = (customer) => {
		const prefix = formatTitlePrefix(customer.title);
		const name = formatCustomerDisplay(customer).toUpperCase();
		return prefix ? `${prefix} ${name}` : name;
	};

	const filteredCustomers = useMemo(() => {
		if (!customerName) return business.customers || [];
		return (business.customers || []).filter((c) => {
			const displayName = formatCustomerDisplay(c).toLowerCase();
			return displayName.includes(customerName.toLowerCase());
		});
	}, [customerName]);

	const selectCustomer = (customer) => {
		setCustomerName(formatCustomerDisplay(customer));
		setCustomerId(customer.id);
		setCustomerTitle(customer.title || "");
		setClientIdInput(String(customer.id || ""));
		setShowSuggestions(false);
	};

	const getFilteredServices = (itemIndex) => {
		const item = items[itemIndex];
		if (!item?.description) return business.services || [];
		return (business.services || []).filter((s) =>
			s.name.toLowerCase().includes(item.description.toLowerCase())
		);
	};

	const selectService = (itemIndex, service) => {
		updateItem(itemIndex, "description", service.name);
		updateItem(itemIndex, "price", service.price);
		setShowItemSuggestions((prev) => ({ ...prev, [itemIndex]: false }));
	};

	const calculateTotals = (lineItems, dpType = null, dpValue = null) => {
		const subtotal = lineItems.reduce((sum, item) => {
			const qty = Number(item.quantity) || 0;
			const price = Number(item.price) || 0;
			return sum + qty * price;
		}, 0);

		const type = dpType ?? downpaymentType;
		const value = dpValue ?? downpaymentValue;
		const downpayment = type === "percentage" 
			? (subtotal * Number(value)) / 100 
			: Number(value);

		return {
			subtotal,
			downpayment,
			balance: subtotal - downpayment,
			grandTotal: subtotal,
		};
	};

	const totals = useMemo(() => calculateTotals(items, downpaymentType, downpaymentValue), [items, downpaymentType, downpaymentValue]);

	useEffect(() => {
		try {
			const stored = JSON.parse(localStorage.getItem("docSuffixHistory") || "[]");
			if (Array.isArray(stored) && stored.length > 0) {
				setSuffixOptions(stored);
			}
		} catch (error) {
			// Keep the default options when storage is unavailable or invalid.
		}
	}, []);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (customerAutocompleteRef.current && !customerAutocompleteRef.current.contains(event.target)) {
				setShowSuggestions(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const normalizeSuffix = (value) => {
		return value.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 2);
	};

	const formatDocDate = (dateValue) => {
		if (!dateValue) return "000000";
		const parts = dateValue.split("-");
		if (parts.length !== 3) return "000000";
		const [year, month, day] = parts;
		return `${year.slice(-2)}${month}${day}`;
	};

	const buildDocNumber = (type, clientId, dateValue, suffix) => {
		const prefix = type === "invoice" ? "IN" : "QT";
		const safeId = clientId && clientId !== "-" ? clientId : "0000000";
		const safeDate = formatDocDate(dateValue);
		const safeSuffix = normalizeSuffix(suffix || "A1");
		return `${prefix}-${safeId}-${safeDate}${safeSuffix}`;
	};

	const docNumber = useMemo(
		() => buildDocNumber(docType, customerId, quoteDate, docSuffix),
		[docType, customerId, quoteDate, docSuffix]
	);

	const docNumberPlaceholder = useMemo(() => {
		if (docType !== "quotation") return "";
		const idPart = clientIdInput || "50~~";
		const datePart = quoteDate ? formatDocDate(quoteDate) : "YYMMDD";
		const suffixPart = normalizeSuffix(docSuffix || "A1") || "A1";
		return `QT-${idPart}-${datePart}${suffixPart}`;
	}, [docType, clientIdInput, quoteDate, docSuffix]);

	const persistSuffix = (suffixValue) => {
		const cleaned = normalizeSuffix(suffixValue);
		if (!cleaned) return;
		setSuffixOptions((prev) => {
			const next = [cleaned, ...prev.filter((item) => item !== cleaned)].slice(0, 8);
			if (typeof window !== "undefined") {
				localStorage.setItem("docSuffixHistory", JSON.stringify(next));
			}
			return next;
		});
	};

	const downloadJson = (payload) => {
		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		const safeDocNumber = (payload.docNumber || "document").replace(/[^a-z0-9-]/gi, "_");
		link.href = url;
		link.download = `${safeDocNumber}.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const buildPayload = () => {
		return {
			docType,
			docNumber,
			sourceDocNumber: docType === "invoice" ? invoiceData?.docNumber || "" : "",
			suffix: normalizeSuffix(docSuffix || "A1"),
			customerName,
			customerId,
			customerTitle,
			quoteDate,
			items,
			totals: calculateTotals(items, downpaymentType, downpaymentValue),
			downpaymentType: docType === "invoice" ? downpaymentType : null,
			downpaymentValue: docType === "invoice" ? downpaymentValue : null,
		};
	};

	const handleInvoiceFile = async (event) => {
		const file = event.target.files && event.target.files[0];
		if (!file) return;
		try {
			const text = await file.text();
			const data = JSON.parse(text);
			setInvoiceData(data);
			setInvoiceFileName(file.name);
			setCustomerName(data.customerName || "");
			setCustomerId(data.customerId || "-");
			setCustomerTitle(data.customerTitle || "");
			setQuoteDate(data.quoteDate || new Date().toISOString().split('T')[0]);
			setItems(Array.isArray(data.items) && data.items.length > 0 ? data.items : [createItem(0)]);
			setDocSuffix(normalizeSuffix(data.suffix || data.docSuffix || "A1"));
		} catch (error) {
			console.error("Failed to read invoice JSON:", error);
		}
	};

	const formatCurrency = (value) => {
		const num = Number(value);
		const formatted = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return `PHP ${formatted}`.replace(/\.00$/, "");
	};

	const updateItem = (index, field, value) => {
		setItems((prev) =>
			prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
		);
	};

	const addItem = () => {
		setItems((prev) => [...prev, createItem(nextItemId.current++)]);
	};

	const removeItem = (index) => {
		setItems((prev) => {
			if (prev.length === 1) {
				return prev;
			}
			return prev.filter((_, idx) => idx !== index);
		});
	};

	const loadImageForPdf = (src, maxWidth = 800, quality = 0.85) => {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => {
				// Calculate scaled dimensions to reduce file size
				let width = img.width;
				let height = img.height;
				
				if (width > maxWidth) {
					const scale = maxWidth / width;
					width = maxWidth;
					height = height * scale;
				}
				
				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				ctx.fillStyle = "#FFFFFF";
				ctx.fillRect(0, 0, width, height);
				ctx.drawImage(img, 0, 0, width, height);
				
				// Use JPEG with compression for much smaller file size
				const dataUrl = canvas.toDataURL("image/jpeg", quality);
				resolve({ dataUrl, width: img.width, height: img.height });
			};
			img.onerror = reject;
			img.src = src;
		});
	};

	const generatePdf = async (payload) => {
		const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 48;
		const tableWidth = pageWidth - margin * 2;
		const colWidths = [tableWidth * 0.5, tableWidth * 0.12, tableWidth * 0.18, tableWidth * 0.2];
		const h1Size = 22;
		const h2Size = 16;
		const h3Size = 12;
		let y = margin;

		// Load logo image (higher quality for header)
		let logoData = null;
		let logoWidth = 0;
		const logoHeight = 72;
		try {
			logoData = await loadImageForPdf("/icon/logo.png", 400, 0.9);
			const aspectRatio = logoData.width / logoData.height;
			logoWidth = logoHeight * aspectRatio;
		} catch (error) {
			console.error("Failed to load logo:", error);
			logoData = null;
		}

		// Left column: Logo and company info - side by side at same height
		const headerStartY = y;
		const headerHeight = 72;

		if (logoData) {
			doc.addImage(
				logoData.dataUrl,
				"JPEG",
				margin,
				headerStartY - 8,
				logoWidth,
				logoHeight
			);
		}

		doc.setFont("helvetica", "bold");
		doc.setFontSize(h1Size);
		const titleLine1 = "TWIN BUILDING";
		const titleLine2 = "ENGINEERING DESIGN SERVICES";
		const titleX = logoData ? margin + logoWidth : margin + 4;
		const titleY = headerStartY + 24;
		const line1Width = doc.getTextWidth(titleLine1);
		const line2Width = doc.getTextWidth(titleLine2);
		const adjustedLine2Size = line2Width > 0
			? Math.min(h1Size, Math.max(10, (line1Width / line2Width) * h1Size))
			: h1Size;

		doc.setTextColor(242, 134, 39);
		doc.text(titleLine1, titleX, titleY);
		doc.setTextColor(0, 0, 0);
		const line2FontSize = adjustedLine2Size - 0.4;
		doc.setFontSize(line2FontSize);
		const line2Y = titleY + line2FontSize + 2;
		doc.setTextColor(70, 70, 70);
		doc.text(titleLine2, titleX, line2Y);
		doc.setTextColor(0, 0, 0);

		doc.setFont("helvetica", "normal");
		doc.setFontSize(8.75);
		doc.text(contents.website.address || "", titleX, line2Y + 14);

		// Right column: Customer info (aligned at top)
		const rightX = pageWidth - margin;
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9.5);
		let rightY = headerStartY + 14;
		doc.setFont("helvetica", "normal");
		const rawTitle = (payload.customerTitle || "").trim();
		const clientName = (payload.customerName || "").trim();
		const namePart = clientName ? clientName.toUpperCase() : "-";
		const titlePart = rawTitle ? rawTitle.toUpperCase() : "";
		const formattedName = titlePart
			? `CLIENT: ${titlePart} ${namePart}`
			: `CLIENT: ${namePart}`;
		doc.text(formattedName, rightX, rightY, { align: "right" });
		rightY += 14;
		doc.text(
			payload.docType === "invoice" ? (payload.sourceDocNumber || "-") : (payload.docNumber || "-"),
			rightX,
			rightY,
			{ align: "right" }
		);
		rightY += 14;
		if (payload.docType === "invoice") {
			doc.text(payload.docNumber || "-", rightX, rightY, { align: "right" });
			rightY += 14;
		}
		doc.setFont("helvetica", "normal");
		doc.text(formatLongDate(payload.quoteDate) || "-", rightX, rightY, { align: "right" });

		// Watermark (using logo image with aggressive compression)
		let watermarkData = null;
		try {
			watermarkData = await loadImageForPdf("/icon/logo.png", 600, 0.7);
		} catch (error) {
			console.error("Failed to load watermark:", error);
			watermarkData = null;
		}
		if (watermarkData && doc.setGState && doc.GState) {
			const watermarkWidth = pageWidth * 0.75;
			const aspectRatio = watermarkData.width / watermarkData.height;
			const watermarkHeight = watermarkWidth / aspectRatio;
			const centerX = (pageWidth - watermarkWidth) / 2;
			const centerY = (pageHeight - watermarkHeight) / 2 - 40;
			doc.setGState(new doc.GState({ opacity: 0.08 }));
			doc.addImage(
				watermarkData.dataUrl,
				"JPEG",
				centerX,
				centerY,
				watermarkWidth,
				watermarkHeight
			);
			doc.setGState(new doc.GState({ opacity: 1 }));
		}

		y += 90 + 42;

		// Centered title
		doc.setFont("helvetica", "bold");
		doc.setFontSize(h2Size);
		const centerTitle = payload.docType === "invoice" ? "SERVICE INVOICE" : "SERVICE QUOTATION";
		doc.text(centerTitle, pageWidth / 2, y, { align: "center" });

		y += 26;

		y += 24;

		// Table header with giron background
		const headerRowPadding = 8;
		const headerRowHeight = h3Size + headerRowPadding * 2 + 4;
		const headerRadius = 6;
		doc.setFillColor(242, 134, 39);
		doc.roundedRect(margin, y - headerRowPadding, tableWidth, headerRowHeight, headerRadius, headerRadius, "F");

		doc.setFont("helvetica", "bold");
		doc.setFontSize(h3Size);
		doc.setTextColor(255, 255, 255);
		const headerTextY = y + headerRowPadding + 6;
		doc.text("ITEM DESCRIPTION", margin + 16, headerTextY);
		doc.text("QTY", margin + colWidths[0] + 32, headerTextY, { align: "left" });
		doc.text("PRICE", margin + colWidths[0] + colWidths[1] + 32, headerTextY, { align: "left" });
		doc.text("TOTAL", margin + colWidths[0] + colWidths[1] + colWidths[2] + 32, headerTextY, { align: "left" });
		doc.setTextColor(0, 0, 0);

		y += headerRowHeight;

		y += 8;
		doc.setFont("helvetica", "normal");

		const bankLines = contents.author.bankDetails || [];
		const blockPadding = 8;
		const footerHeight = 28;
		const footerRadius = 3;
		const footerY = pageHeight - margin - footerHeight;

		const termsHeight = 68;
		const termsY = footerY - 12 - termsHeight;

		const payableHeight = 92;
		const payableY = termsY - 12 - payableHeight;

		const payloadTotals = payload.totals || calculateTotals(payload.items);
		payload.items.forEach((item) => {
			const qty = Number(item.quantity) || 0;
			const price = Number(item.price) || 0;
			const total = qty * price;
			const desc = item.description || "-";
			const descLines = doc.splitTextToSize(desc, colWidths[0] - 8);
			const rowHeight = Math.max(16, descLines.length * 14);

			if (y + rowHeight + 40 > pageHeight - margin) {
				doc.addPage();
				y = margin;
			}

			// Add background to table row

		doc.setFont("helvetica", "normal");
		doc.setFontSize(9);
		doc.text(descLines, margin + 16, y + 12);
		doc.text(String(qty), margin + colWidths[0] + 16 + 32, y + 12);
		doc.text(formatCurrency(price), margin + colWidths[0] + colWidths[1] + 32, y + 12);
		doc.text(formatCurrency(total), margin + colWidths[0] + colWidths[1] + colWidths[2] + 32, y + 12);

			y += rowHeight;
			doc.setDrawColor(220);
			doc.line(margin, y, pageWidth - margin, y);
			y += 8;
		});

		y += 6;
		doc.setFont("helvetica", "bold");

		// Always show Subtotal
		doc.text("Subtotal", margin + colWidths[0] + colWidths[1] + 32, y + 12);
		doc.text(formatCurrency(payloadTotals.subtotal), margin + colWidths[0] + colWidths[1] + colWidths[2] + 32, y + 12);

		// Check if this is an invoice with downpayment
		if (payload.docType === "invoice" && payload.downpaymentValue != null && payload.downpaymentValue !== 0) {
			// Show Downpayment
			y += 16;
			doc.text("Downpayment", margin + colWidths[0] + colWidths[1] + 32, y + 12);
			doc.text(formatCurrency(payloadTotals.downpayment), margin + colWidths[0] + colWidths[1] + colWidths[2] + 32, y + 12);
			
			// Show Balance Due
			y += 16;
			doc.text("Balance Due", margin + colWidths[0] + colWidths[1] + 32, y + 12);
			doc.text(formatCurrency(payloadTotals.balance), margin + colWidths[0] + colWidths[1] + colWidths[2] + 32, y + 12);
		} else {
			// Show Grand Total for quotations or when no downpayment
			y += 16;
			doc.text("Grand Total", margin + colWidths[0] + colWidths[1] + 32, y + 12);
			doc.text(formatCurrency(payloadTotals.grandTotal), margin + colWidths[0] + colWidths[1] + colWidths[2] + 32, y + 12);
		}

		// Payable block
		doc.setFillColor(0, 0, 0);
		doc.setGState(new doc.GState({ opacity: 0.05 }));
		doc.roundedRect(margin, payableY, tableWidth, payableHeight, footerRadius, footerRadius, "F");
		doc.setGState(new doc.GState({ opacity: 1 }));

		doc.setFont("helvetica", "bold");
		doc.setFontSize(10.5);
		doc.text("Payable to:", margin + 10, payableY + blockPadding + 10);
		doc.setFont("helvetica", "normal");
		doc.text(contents.author.name.full || "", margin + 10, payableY + blockPadding + 26);
		const authorNameMarginBottom = 8;

		const bankColWidth = tableWidth / 3;
		const bankRowY = payableY + blockPadding + 42 + authorNameMarginBottom;
		const bankIcons = await Promise.all(
			bankLines.map(async (bank) => {
				if (!bank.icon) return null;
				const iconPath = bank.icon.startsWith("/") ? bank.icon : `/icon/${bank.icon}`;
				try {
					return await loadImageForPdf(iconPath, 200, 0.85);
				} catch (error) {
					return null;
				}
			})
		);

		bankLines.forEach((bank, index) => {
			const colX = (pageWidth - tableWidth) / 2 + bankColWidth * index + 10 + 16;
			const iconData = bankIcons[index];
			if (iconData) {
				const iconHeightTarget = 20;
				const aspectRatio = iconData.width / iconData.height;
				const iconWidthTarget = iconHeightTarget * aspectRatio;
				doc.addImage(
					iconData.dataUrl,
					"JPEG",
					colX,
					bankRowY - 9,
					iconWidthTarget,
					iconHeightTarget
				);
			}
			doc.setFont("helvetica", "normal");
			doc.setFontSize(9.5);
			const textX = iconData ? colX + (iconData.width / iconData.height) * 20 + 6 : colX;
			doc.text(contents.author.name.base || "", textX, bankRowY);
			doc.text(bank.number || "", textX, bankRowY + 12);
		});

		// Terms and conditions block
		doc.setFillColor(0, 0, 0);
		doc.setGState(new doc.GState({ opacity: 0.05 }));
		doc.roundedRect(margin, termsY, tableWidth, termsHeight, footerRadius, footerRadius, "F");
		doc.setGState(new doc.GState({ opacity: 1 }));

		doc.setFont("helvetica", "bold");
		doc.setFontSize(10.5);
		doc.text("Terms and conditions:", margin + 10, termsY + blockPadding + 10);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9);
		const termsLines = [
			"- All rates quoted are valid for 15 days.",
		];
		if (payload.docType === "quotation") {
			termsLines.push("- 50% payment should be done in advance.");
			termsLines.push("- The remaining amount should be paid within 20 days of delivery.");
		}
		
		// Add downpayment message for invoices and ensure remaining-amount line is last
		if (payload.docType === "invoice") {
			if (payload.downpaymentValue !== null) {
				const downpaymentAmount = formatCurrency(payload.totals.downpayment);
				if (payload.downpaymentType === "percentage") {
					termsLines.push(`- A ${payload.downpaymentValue}% downpayment of ${downpaymentAmount} is required to proceed.`);
				} else {
					termsLines.push(`- A downpayment of ${downpaymentAmount} is required to proceed.`);
				}
			}
			termsLines.push("- The remaining amount should be paid within 20 days of delivery.");
		}
		
		let termsY_offset = 0;
		termsLines.forEach((line, index) => {
			doc.text(line, margin + 10, termsY + blockPadding + 26 + termsY_offset);
			termsY_offset += 10;
		});

		// Add padding after terms

		// Footer with three columns
		doc.setFillColor(0, 0, 0);
		doc.setGState(new doc.GState({ opacity: 0.05 }));
		doc.roundedRect(margin, footerY, tableWidth, footerHeight, footerRadius, footerRadius, "F");
		doc.setGState(new doc.GState({ opacity: 1 }));

		doc.setFont("helvetica", "normal");
		doc.setFontSize(9);
		const footerTextY = footerY + blockPadding + 10;
		const col1X = margin + 8;
		const col2X = margin + tableWidth / 2;
		const col3X = pageWidth - margin - 8;
		doc.text(contents.author.contact || "", col1X, footerTextY);
		doc.text(contents.website.email || "", col2X, footerTextY, { align: "center" });
		doc.text(contents.website.domain || "", col3X, footerTextY, { align: "right" });

		const safeDocNumber = (payload.docNumber || "document").replace(/[^a-z0-9-]/gi, "_");
		const fileName = `${safeDocNumber}.pdf`;
		doc.save(fileName);
	};

	const handleGenerate = async () => {
		if (docType === "invoice" && !invoiceData) {
			alert("Upload a quotation JSON file before generating the invoice.");
			return;
		}
		const payload = buildPayload();
		persistSuffix(payload.suffix);
		if (docType === "quotation") {
			downloadJson(payload);
		}
		await generatePdf(payload);
	};

	return (
		<>
		<Header />
		<main className={`${styles.main} pageEnter`}>
			<section className={styles.hero}>
				<p className={styles.kicker}>Docs</p>
				<h1>{docType === "invoice" ? "Invoice Generator" : "Quote Generator"}</h1>
			</section>

			<section className={styles.section}>
			<div className={styles.formCard} suppressHydrationWarning>
				<div className={styles.docTypeRow}>
					<button
						type="button"
						className={`${styles.docTypeButton} ${docType === "quotation" ? styles.docTypeButtonActive : ""}`}
						onClick={() => setDocType("quotation")}
						>
						Quotation
					</button>
					<button
						type="button"
						className={`${styles.docTypeButton} ${docType === "invoice" ? styles.docTypeButtonActive : ""}`}
						onClick={() => setDocType("invoice")}
					>
						Invoice
					</button>
				</div>

					{docType === "quotation" && (
						<>
					<div className={styles.formGrid}>
						<label className={styles.inputGroup}>
							<span>Client name</span>
					<div className={styles.autocompleteWrapper} ref={customerAutocompleteRef}>
							<input
								type="text"
								value={customerName}
								onChange={(e) => {
									setCustomerName(e.target.value);
									setShowSuggestions(true);
								}}
								onFocus={() => setShowSuggestions(true)}
								placeholder="Enter client"
								/>
							{showSuggestions && filteredCustomers.length > 0 && (
								<div className={styles.suggestions}>
									{filteredCustomers.map((customer) => (
										<button
										key={customer.id}
										type="button"
										className={styles.suggestionItem}
										onClick={() => selectCustomer(customer)}
										>
								<span className={styles.suggestionName}>{formatCustomerDisplay(customer)}</span>
											<span className={styles.suggestionId}>ID: {customer.id}</span>
										</button>
									))}
								</div>
							)}
						</div>
						</label>
						<label className={styles.inputGroup}>
							<span>Title</span>
							<input
								type="text"
								value={customerTitle}
								onChange={(e) => setCustomerTitle(e.target.value)}
								list="title-options"
								placeholder="Mr., Mrs., Ms., Engr., Arch., Dr., Prof., Atty."
							/>
							<datalist id="title-options">
								<option value="Mr." />
								<option value="Mrs." />
								<option value="Ms." />
								<option value="Engr." />
								<option value="Arch." />
								<option value="Dr." />
								<option value="Prof." />
								<option value="Atty." />
							</datalist>
						</label>
						<label className={styles.inputGroup}>
							<span>Date</span>
							<input
								type="date"
								value={quoteDate}
								onChange={(e) => setQuoteDate(e.target.value)}
								/>
						</label>
						<label className={styles.inputGroup}>
							<span>Increment</span>
							<input
								type="text"
								value={docSuffix}
								list="suffix-options"
								maxLength={2}
								onChange={(e) => setDocSuffix(normalizeSuffix(e.target.value))}
								placeholder="A1"
								/>
							<datalist id="suffix-options">
								{suffixOptions.map((option) => (
									<option key={option} value={option} />
								))}
							</datalist>
						</label>
						<label className={styles.inputGroup}>
							<span>Client ID</span>
							<input
								type="text"
								inputMode="numeric"
								pattern="[0-9~]*"
								maxLength={4}
								value={clientIdInput}
								onChange={(e) => {
									const cleaned = e.target.value.replace(/[^0-9~]/g, "").slice(0, 4);
									setClientIdInput(cleaned);
								}}
								onBlur={() => {
									if (clientIdInput) {
										setCustomerId(clientIdInput);
									} else {
										setCustomerId("-");
									}
								}}
								placeholder="50~~"
							/>
						</label>
						<label className={styles.inputGroup}>
							<span>{docType === "invoice" ? "Invoice No." : "Quotation No."}</span>
							<input
								type="text"
								value={docNumber}
								readOnly
								placeholder={docType === "quotation" ? docNumberPlaceholder : undefined}
							/>
						</label>
					</div>

					<div className={styles.table}>
						<div className={`${styles.row} ${styles.rowHeader}`}>
							<span>Item</span>
							<span>Qty</span>
							<span>Price</span>
							<span>Total</span>
							<span />
						</div>
						{items.map((item, index) => (
							<div key={item.id} className={styles.row}>
								<div className={styles.autocompleteWrapper}>
									<input
										type="text"
										value={item.description}
										onChange={(e) => {
											updateItem(index, "description", e.target.value);
											setShowItemSuggestions((prev) => ({ ...prev, [index]: true }));
										}}
										onFocus={() => setShowItemSuggestions((prev) => ({ ...prev, [index]: true }))}
										onBlur={() => setTimeout(() => setShowItemSuggestions((prev) => ({ ...prev, [index]: false })), 100)}
										placeholder="Item description"
										/>
									{showItemSuggestions[index] && getFilteredServices(index).length > 0 && (
										<div className={styles.suggestions}>
											{getFilteredServices(index).map((service) => (
												<button
												key={service.id}
												type="button"
												className={styles.suggestionItem}
												onMouseDown={() => selectService(index, service)}
												>
													<span className={styles.suggestionName}>{service.name}</span>
													<span className={styles.suggestionId}>PHP {service.price.toFixed(2)}</span>
												</button>
											))}
										</div>
									)}
								</div>
								<input
									type="number"
									min="0"
									value={item.quantity}
									onChange={(e) => updateItem(index, "quantity", e.target.value)}
									/>
								<input
									type="number"
									min="0"
									step="0.01"
									value={item.price}
									onChange={(e) => updateItem(index, "price", e.target.value)}
									onFocus={(e) => {
										if (e.target.value === "0") {
											updateItem(index, "price", "");
										}
									}}
									/>
								<span>{formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0))}</span>
								<button
									type="button"
									className={styles.removeButton}
									onClick={() => removeItem(index)}
									aria-label="Remove item"
									>
									Remove
								</button>
							</div>
						))}
					</div>

					<div className={styles.actionRow}>
						<button type="button" className={styles.addButton} onClick={addItem}>
							Add item
						</button>
						<div className={styles.totalBox}>
							<span>Grand total</span>
							<strong>{formatCurrency(totals.grandTotal)}</strong>
						</div>
					</div>
					</>
					)}

					{docType === "invoice" && (
						<div className={styles.formGrid}>
							<label className={styles.inputGroup}>
								<span>Downpayment type</span>
								<select
									value={downpaymentType}
									onChange={(e) => setDownpaymentType(e.target.value)}
								>
									<option value="">Select type</option>
									<option value="percentage">Percentage (%)</option>
									<option value="fixed">Fixed Amount</option>
								</select>
							</label>
							<label className={styles.inputGroup}>
								<span>Downpayment value</span>
								<input
									type="number"
									value={downpaymentValue}
									onChange={(e) => setDownpaymentValue(e.target.value)}
									placeholder="Enter value"
								/>
							</label>
						</div>
					)}

					{docType === "invoice" && (
						<label className={styles.inputGroup}>
							<span>Upload quotation JSON</span>
							<input
								type="file"
								accept="application/json"
								onChange={handleInvoiceFile}
								/>
							{invoiceFileName && (
								<span className={styles.fileHint}>{invoiceFileName}</span>
							)}
						</label>
					)}

					<button type="button" className={styles.generateButton} onClick={handleGenerate}>
						Generate PDF
					</button>
				</div>
			</section>
		</main>
		<Footer />
	</>
	);
}
