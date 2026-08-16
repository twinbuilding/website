"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import contents from "@/data/contents.json";
import business from "@/data/business.json";
import styles from "./page.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/Button";

const PREVIEW_DEBOUNCE_MS = 800;
const createItem = (id) => ({ id, description: "", quantity: 1, price: 0 });
const getTodayDateValue = () => new Date().toISOString().split("T")[0];
const getDateOffsetValue = (dateString, days) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return "";
	date.setDate(date.getDate() + days);
	return date.toISOString().split("T")[0];
};

export default function GeneratePage() {
	const [docType, setDocType] = useState("quotation");
	const [customerName, setCustomerName] = useState("");
	const [customerId, setCustomerId] = useState("-");
	const [customerTitle, setCustomerTitle] = useState("");
	const [location, setLocation] = useState("");
	const [showSuggestions, setShowSuggestions] = useState(false);
	const customerAutocompleteRef = useRef(null);
	const [quoteDate, setQuoteDate] = useState(getTodayDateValue());
	const nextItemId = useRef(1);
	const [items, setItems] = useState([createItem(0)]);
	const [showItemSuggestions, setShowItemSuggestions] = useState({});
	const [docSuffix, setDocSuffix] = useState("A1");
	const [suffixOptions, setSuffixOptions] = useState(["A1"]);
	const [invoiceData, setInvoiceData] = useState(null);
	const [invoiceFileName, setInvoiceFileName] = useState("");
	const [invoiceUploadError, setInvoiceUploadError] = useState("");
	const [receiptData, setReceiptData] = useState(null);
	const [receiptFileName, setReceiptFileName] = useState("");
	const [receiptUploadError, setReceiptUploadError] = useState("");
	const [receiptAmountPaid, setReceiptAmountPaid] = useState("");
	const [paymentStatus, setPaymentStatus] = useState("partial");
	const [receiptBalanceAmount, setReceiptBalanceAmount] = useState("");
	const [balanceDueDate, setBalanceDueDate] = useState(getDateOffsetValue(getTodayDateValue(), 20));
	const [receiptDate, setReceiptDate] = useState(getTodayDateValue());
	const [downpaymentType, setDownpaymentType] = useState("percentage");
	const [downpaymentValue, setDownpaymentValue] = useState(50);
	const [clientIdInput, setClientIdInput] = useState("");
	const [comments, setComments] = useState("");
	const [previewUrl, setPreviewUrl] = useState("");
	const [previewError, setPreviewError] = useState("");
	const [isPreviewing, setIsPreviewing] = useState(false);
	const [attemptedSubmit, setAttemptedSubmit] = useState(false);
	const [generateError, setGenerateError] = useState("");
	const [isUnlocked, setIsUnlocked] = useState(false);
	const [passwordInput, setPasswordInput] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const attemptedSubmitRef = useRef(null);

	const LOCK_PAGE_PASSWORD = "TrentProtector";

	useEffect(() => {
		if (typeof window === "undefined") return;
		const stored = window.localStorage.getItem("generatePageUnlocked");
		if (stored === "true") {
			setIsUnlocked(true);
		}
	}, []);

	const handleUnlockSubmit = (event) => {
		event.preventDefault();
		if (passwordInput === LOCK_PAGE_PASSWORD) {
			setIsUnlocked(true);
			window.localStorage.setItem("generatePageUnlocked", "true");
			setPasswordError("");
			return;
		}
		setPasswordError("Incorrect password. Please try again.");
	};

	const handlePasswordChange = (event) => {
		setPasswordInput(event.target.value);
		if (passwordError) setPasswordError("");
	};

	const formatLongDate = (dateString) => {
		if (!dateString) return "";
		const date = new Date(dateString);
		const months = [
			"January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December",
		];
		return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
	};

	const isExpectedUploadedFilePrefix = (fileName, expectedPrefix) => {
		const baseName = (fileName || "").split(/[\\/]/).pop();
		if (!baseName) return false;
		return baseName.toUpperCase().startsWith(expectedPrefix);
	};

	const resolveReceiptAmountPaid = (data, selectedStatus) => {
		if (!data) return "";
		const explicitAmount = data.amountPaid;
		if (explicitAmount != null && explicitAmount !== "") return explicitAmount;
		if (selectedStatus === "partial") {
			const downpayment = data?.totals?.downpayment;
			if (downpayment != null && downpayment !== "") return downpayment;
		}
		const grandTotal = data?.totals?.grandTotal;
		if (grandTotal != null && grandTotal !== "") return grandTotal;
		const downpayment = data?.totals?.downpayment;
		if (downpayment != null && downpayment !== "") return downpayment;
		return "";
	};

	const resolveReceiptBalanceAmount = (data) => {
		if (!data) return "";
		const explicitBalance = data.balanceAmount;
		if (explicitBalance != null && explicitBalance !== "") return explicitBalance;
		const balance = data?.totals?.balance;
		if (balance != null && balance !== "") return balance;
		return "";
	};

	const resolveReceiptPaymentStatus = (data) => {
		if (!data) return "partial";
		const balance = Number(data?.totals?.balance ?? 0);
		return Number.isFinite(balance) && balance > 0 ? "partial" : "full";
	};

	const formatCustomerDisplay = (customer) => {
		if (typeof customer.name === "string") return customer.name;
		const fullName = `${customer.name.first || ""} ${customer.name.last || ""}`.trim();
		return fullName || "";
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

	const totals = useMemo(
		() => calculateTotals(items, downpaymentType, downpaymentValue),
		[items, downpaymentType, downpaymentValue]
	);

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
		if (paymentStatus !== "partial") {
			setReceiptBalanceAmount("");
			return;
		}

		if (!receiptData) {
			return;
		}

		const totalAmount = Number(
			receiptData?.totals?.grandTotal ??
			receiptData?.totals?.subtotal ??
			receiptData?.totals?.balance ??
			receiptData?.totals?.downpayment ??
			0
		);
		const paidAmount = Number(receiptAmountPaid || 0);

		if (!Number.isFinite(totalAmount) || !Number.isFinite(paidAmount)) {
			return;
		}

		const nextBalance = Math.max(0, totalAmount - paidAmount);
		setReceiptBalanceAmount(String(nextBalance));
	}, [paymentStatus, receiptAmountPaid, receiptData]);

	useEffect(() => {
		if (paymentStatus !== "partial") {
			return;
		}

		const baseDate = receiptData?.quoteDate || quoteDate || receiptDate;
		if (!balanceDueDate && baseDate) {
			setBalanceDueDate(getDateOffsetValue(baseDate, 20));
		}
	}, [paymentStatus, receiptData, quoteDate, receiptDate, balanceDueDate]);

	useEffect(() => {
		if (docType === "receipt" && !receiptDate) {
			setReceiptDate(getTodayDateValue());
		}
	}, [docType, receiptDate]);

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
		const prefix = type === "invoice" ? "IN" : type === "receipt" ? "RC" : "QT";
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
			location,
			quoteDate,
			items,
			totals: calculateTotals(items, downpaymentType, downpaymentValue),
			downpaymentType: docType === "invoice" ? downpaymentType : null,
			downpaymentValue: docType === "invoice" ? downpaymentValue : null,
			comments,
			receiptData,
			receiptAmountPaid,
			paymentStatus,
			receiptBalanceAmount,
			balanceDueDate,
			receiptDate,
		};
	};

	const payload = useMemo(
		() => buildPayload(),
		[
			docType,
			docNumber,
			invoiceData,
			receiptData,
			docSuffix,
			customerName,
			customerId,
			customerTitle,
			location,
			quoteDate,
			items,
			downpaymentType,
			downpaymentValue,
			comments,
			receiptAmountPaid,
			paymentStatus,
			receiptBalanceAmount,
			balanceDueDate,
			receiptDate,
		]
	);

	const handleInvoiceFile = async (event) => {
		const file = event.target.files && event.target.files[0];
		if (!file) return;

		if (!isExpectedUploadedFilePrefix(file.name, "QT")) {
			setInvoiceData(null);
			setInvoiceFileName("");
			setInvoiceUploadError("Please upload a quotation JSON file (prefixed with QT).");
			setPreviewError("Please upload a quotation JSON file (prefixed with QT).");
			setGenerateError("Please upload a quotation JSON file (prefixed with QT).");
			return;
		}

		setInvoiceUploadError("");
		try {
			const text = await file.text();
			const data = JSON.parse(text);
			setInvoiceData(data);
			setInvoiceFileName(file.name);
			setCustomerName(data.customerName || "");
			setCustomerId(data.customerId || "-");
			setCustomerTitle(data.customerTitle || "");
			setLocation(data.location || "");
			setQuoteDate(data.quoteDate || getTodayDateValue());
			setItems(Array.isArray(data.items) && data.items.length > 0 ? data.items : [createItem(0)]);
			setDocSuffix(normalizeSuffix(data.suffix || data.docSuffix || "A1"));
		} catch (error) {
			console.error("Failed to read invoice JSON:", error);
		}
	};

	const handleReceiptFile = async (event) => {
		const file = event.target.files && event.target.files[0];
		if (!file) return;

		if (!isExpectedUploadedFilePrefix(file.name, "IN")) {
			setReceiptData(null);
			setReceiptFileName("");
			setReceiptUploadError("Please upload an invoice JSON file (prefixed with IN).");
			setPreviewError("Please upload an invoice JSON file (prefixed with IN).");
			setGenerateError("Please upload an invoice JSON file (prefixed with IN).");
			return;
		}

		setReceiptUploadError("");
		try {
			const text = await file.text();
			const data = JSON.parse(text);
			const nextPaymentStatus = resolveReceiptPaymentStatus(data);
			const nextAmountPaid = resolveReceiptAmountPaid(data, nextPaymentStatus);
			const nextBalanceAmount = resolveReceiptBalanceAmount(data);
			setReceiptData(data);
			setReceiptFileName(file.name);
			setReceiptAmountPaid(nextAmountPaid);
			setReceiptBalanceAmount(nextPaymentStatus === "partial" ? nextBalanceAmount : "");
			setPaymentStatus(nextPaymentStatus);
			setBalanceDueDate(getDateOffsetValue(data.quoteDate || getTodayDateValue(), 20));
			setReceiptDate(getTodayDateValue());
			setCustomerName(data.customerName || "");
			setCustomerId(data.customerId || "-");
			setCustomerTitle(data.customerTitle || "");
			setLocation(data.location || "");
			setQuoteDate(data.quoteDate || getTodayDateValue());
			setItems(Array.isArray(data.items) && data.items.length > 0 ? data.items : [createItem(0)]);
			setDocSuffix(normalizeSuffix(data.suffix || data.docSuffix || "A1"));
		} catch (error) {
			console.error("Failed to read receipt JSON:", error);
		}
	};

	const formatAmountLabel = (value) => {
		const num = Number(value);
		if (!Number.isFinite(num)) return "P0";
		const rounded = Math.round(num * 100) / 100;
		const formatted = rounded.toLocaleString("en-US", {
			minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
			maximumFractionDigits: 2,
		});
		return `P${formatted}`;
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

	const isFormValid = () => {
		if (!customerName.trim()) return false;
		if (!quoteDate) return false;
		if (!clientIdInput.trim()) return false;
		if (!location.trim()) return false;
		if (docType === "quotation") {
			return items.some((item) => item.description.trim());
		}
		else if (docType === "invoice") {
			return invoiceData !== null;
		}
		else if (docType === "receipt") {
			const amountPaidValue = Number(receiptAmountPaid);
			const balanceValue = Number(receiptBalanceAmount);
			if (!receiptData || !receiptDate) return false;
			if (paymentStatus === "partial") {
				return Boolean(balanceDueDate)
					&& balanceDueDate >= receiptDate
					&& Number.isFinite(balanceValue)
					&& balanceValue >= 0
					&& Number.isFinite(amountPaidValue)
					&& amountPaidValue >= 0;
			}
			return Number.isFinite(amountPaidValue) && amountPaidValue >= 0;
		}
		return true;
	};

	const canGenerate = useMemo(() => isFormValid(), [
		customerName,
		quoteDate,
		clientIdInput,
		location,
		items,
		docType,
		invoiceData,
		receiptData,
		receiptAmountPaid,
		paymentStatus,
		receiptBalanceAmount,
		balanceDueDate,
		receiptDate,
	]);

	useEffect(() => {
		if (canGenerate && generateError) {
			setGenerateError("");
		}
	}, [canGenerate, generateError]);

	const loadImageForPdf = (src, maxWidth = 800, quality = 0.85, outputFormat = "JPEG") => {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => {
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
				if (outputFormat === "JPEG") {
					ctx.fillStyle = "#FFFFFF";
					ctx.fillRect(0, 0, width, height);
				}
				ctx.drawImage(img, 0, 0, width, height);

				const format = outputFormat === "PNG" ? "image/png" : "image/jpeg";
				const dataUrl = canvas.toDataURL(format, quality);
				resolve({ dataUrl, width: img.width, height: img.height });
			};
			img.onerror = reject;
			img.src = src;
		});
	};

	const loadSvgForPdf = async (src) => {
		const response = await fetch(src);
		const svgText = await response.text();
		const parser = new DOMParser();
		const svg = parser.parseFromString(svgText, "image/svg+xml").documentElement;
		const viewBox = svg.getAttribute("viewBox");
		let width = Number.parseFloat(svg.getAttribute("width")) || 0;
		let height = Number.parseFloat(svg.getAttribute("height")) || 0;
		if (viewBox) {
			const parts = viewBox.split(/[ ,]+/).map(Number);
			if (parts.length === 4) {
				width = parts[2];
				height = parts[3];
			}
		}
		if (!width || !height) {
			width = 100;
			height = 100;
		}
		return { svg, width, height };
	};

	const toOrdinal = (value) => {
		const day = Number(value);
		if (!Number.isFinite(day)) return "";
		const suffixes = ["th", "st", "nd", "rd"];
		const v = day % 100;
		return `${day}${suffixes[(v - 20) % 10] !== undefined && (v >= 11 && v <= 13) ? "th" : suffixes[v] || "th"}`;
	};

	const formatLongReceiptDate = (dateString) => {
		if (!dateString) return "";
		const date = new Date(dateString);
		const months = [
			"January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December",
		];
		return `${toOrdinal(date.getDate())} day of ${months[date.getMonth()]}, ${date.getFullYear()}`;
	};

	const numberToWords = (value) => {
		const safeValue = Math.floor(Number(value) || 0);
		if (safeValue === 0) return "Zero";
		const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
		const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
		const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
		const scales = ["", "Thousand", "Million", "Billion"];
		const chunks = [];
		let remaining = safeValue;
		let scaleIndex = 0;
		while (remaining > 0) {
			const chunk = remaining % 1000;
			if (chunk > 0) {
				let chunkText = "";
				const hundreds = Math.floor(chunk / 100);
				const remainder = chunk % 100;
				if (hundreds > 0) {
					chunkText += `${ones[hundreds]} Hundred`;
				}
				if (remainder >= 10 && remainder < 20) {
					chunkText += `${chunkText ? " " : ""}${teens[remainder - 10]}`;
				} else {
					const tensPart = Math.floor(remainder / 10);
					const onesPart = remainder % 10;
					if (tensPart > 0) {
						chunkText += `${chunkText ? " " : ""}${tens[tensPart]}`;
					}
					if (onesPart > 0) {
						chunkText += `${chunkText ? " " : ""}${ones[onesPart]}`;
					}
				}
				if (scales[scaleIndex]) {
					chunkText += `${chunkText ? " " : ""}${scales[scaleIndex]}`;
				}
				chunks.unshift(chunkText);
			}
			remaining = Math.floor(remaining / 1000);
			scaleIndex += 1;
		}
		return chunks.join(" ");
	};

	const createReceiptDocument = async (payloadData) => {
		const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 48;
		const tableWidth = pageWidth - margin * 2;
		const logoHeight = 72;
		let y = margin;
		const lineHeight = 15;

		try {
			const svgData = await loadSvgForPdf("/branding/banner.svg");
			const aspectRatio = svgData.width / svgData.height;
			const bannerWidth = Math.min(tableWidth, logoHeight + 220) * 0.85;
			const bannerHeight = bannerWidth / aspectRatio;
			await svg2pdf(svgData.svg, doc, {
				x: margin - 6,
				y: margin - 15,
				width: bannerWidth,
				height: bannerHeight,
			});
		} catch (error) {
			console.error("Failed to load banner SVG for receipt:", error);
		}

		try {
			const watermarkData = await loadImageForPdf("/branding/logo.png", 800, 0.85);
			const watermarkWidth = pageWidth * 0.75;
			const aspectRatio = watermarkData.width / watermarkData.height;
			const watermarkHeight = watermarkWidth / aspectRatio;
			const centerX = (pageWidth - watermarkWidth) / 2;
			const centerY = (pageHeight - watermarkHeight) / 2 - 40;
			if (doc.setGState && doc.GState) {
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
		} catch (error) {
			console.error("Failed to load watermark PNG for receipt:", error);
		}

		const rightX = pageWidth - margin;
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9.5);
		let rightY = margin + 14;
		const rawTitle = (payloadData.customerTitle || "").trim();
		const clientName = (payloadData.customerName || "").trim();
		const namePart = clientName ? clientName.toUpperCase() : "-";
		const titlePart = rawTitle ? rawTitle.toUpperCase() : "";
		const formattedName = titlePart
			? `CLIENT: ${titlePart} ${namePart}`
			: `CLIENT: ${namePart}`;
		doc.text(formattedName, rightX, rightY, { align: "right" });
		rightY += 14;

		const locationText = (payloadData.location || "").trim();
		if (locationText) {
			doc.text(`LOCATION: ${locationText.toUpperCase()}`, rightX, rightY, { align: "right" });
			rightY += 14;
		}

		const receiptDocNumber = payloadData.receiptData?.docNumber
			|| payloadData.receiptData?.sourceDocNumber
			|| payloadData.docNumber
			|| "-";
		doc.text(`${receiptDocNumber}`.toUpperCase(), rightX, rightY, { align: "right" });
		rightY += 14;
		doc.text(formatLongDate(payloadData.receiptDate || payloadData.quoteDate) || "-", rightX, rightY, { align: "right" });

		y += 90 + 42;
		doc.setFont("helvetica", "bold");
		doc.setFontSize(16);
		doc.text("ACKNOWLEDGEMENT RECEIPT", pageWidth / 2, y, { align: "center" });
		y += 26;
		y += 24;

		doc.setFont("helvetica", "normal");
		doc.setFontSize(11);
		const receiptClientTitle = (payloadData.customerTitle || "").trim();
		const receiptClientName = (payloadData.customerName || "").trim();
		const clientLabel = [receiptClientTitle, receiptClientName].filter(Boolean).join(" ").trim() || "-";
		const amountPaid = Number(payloadData.receiptAmountPaid ?? 0);
		const paymentStatusLabel = payloadData.paymentStatus === "partial" ? "partial" : "full";
		const amountWords = numberToWords(Math.floor(amountPaid));
		const amountText = `${amountWords} Pesos (${formatAmountLabel(amountPaid)})`;
		const introText = `This serves as formal acknowledgement that I, ${contents.author.name.full || ""}, have received the total amount of ${amountText} from ${clientLabel}.`;
		const introLines = doc.splitTextToSize(introText, pageWidth - margin * 2);
		doc.text(introLines, margin, y);
		y += introLines.length * lineHeight + 10;

		const settlementText = `This payment constitutes ${paymentStatusLabel} settlement for professional engineering services rendered, detailed as follows:`;
		const settlementLines = doc.splitTextToSize(settlementText, pageWidth - margin * 2);
		doc.text(settlementLines, margin, y);
		y += settlementLines.length * lineHeight + 10;

		(payloadData.items || []).forEach((item) => {
			const serviceLine = `• ${item.description || "-"}`;
			const serviceLines = doc.splitTextToSize(serviceLine, pageWidth - margin * 2 - 16);
			doc.text(serviceLines, margin + 12, y);
			y += serviceLines.length * lineHeight;
		});

		if (payloadData.paymentStatus === "partial") {
			y += 10;
			const balanceAmount = Number(payloadData.receiptBalanceAmount ?? 0);
			const dueDate = payloadData.balanceDueDate ? formatLongDate(payloadData.balanceDueDate) : "-";
			const balanceText = `The balance of ${formatCurrency(balanceAmount)} shall be paid to me by ${dueDate} upon the completion and turnover of plans to the latter.`;
			const balanceLines = doc.splitTextToSize(balanceText, pageWidth - margin * 2);
			doc.text(balanceLines, margin, y);
			y += balanceLines.length * lineHeight + 10;
		}

		y += 10;
		const receiptDateText = payloadData.receiptDate ? formatLongReceiptDate(payloadData.receiptDate) : "-";
		const addressText = contents.website.address || "";
		const closingText = `Signed and executed at ${addressText}, this ${receiptDateText}.`;
		const closingLines = doc.splitTextToSize(closingText, pageWidth - margin * 2);
		doc.text(closingLines, margin, y);
		y += closingLines.length * lineHeight + 24;

		doc.setFont("helvetica", "bold");
		doc.text(contents.author.name.full || "", margin, y);
		y += lineHeight;
		doc.setFont("helvetica", "normal");
		doc.text(contents.author.title || "", margin, y);
		y += lineHeight + 8;
		doc.text(`PRC License No. ${contents.author.prcLicense || "[Insert License Number]"}`, margin, y);

		const footerHeight = 28;
		const footerRadius = 3;
		const footerY = pageHeight - margin - footerHeight;
		const footerPadding = 8;
		doc.setFillColor(0, 0, 0);
		doc.setGState(new doc.GState({ opacity: 0.05 }));
		doc.roundedRect(margin, footerY, tableWidth, footerHeight, footerRadius, footerRadius, "F");
		doc.setGState(new doc.GState({ opacity: 1 }));

		doc.setFont("helvetica", "normal");
		doc.setFontSize(9);
		const footerTextY = footerY + footerPadding + 10;
		const col1X = margin + 8;
		const col2X = margin + tableWidth / 2;
		const col3X = pageWidth - margin - 8;
		doc.text(contents.author.contact || "", col1X, footerTextY);
		doc.text(contents.website.email || "", col2X, footerTextY, { align: "center" });
		doc.text(contents.website.domain || "", col3X, footerTextY, { align: "right" });

		return doc;
	};

	const createPdfDocument = async (payloadData) => {
		if (payloadData.docType === "receipt") {
			return createReceiptDocument(payloadData);
		}

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

		const logoHeight = 72;
		const headerStartY = y;
		try {
			const svgData = await loadSvgForPdf("/branding/banner.svg");
			const aspectRatio = svgData.width / svgData.height;
			doc.setFont("helvetica", "bold");
			doc.setFontSize(h1Size);
			const line1Width = doc.getTextWidth("TWIN BUILDING");
			doc.setFontSize(h2Size);
			const line2Width = doc.getTextWidth("ENGINEERING DESIGN SERVICES");
			const legacyLogoWidth = logoHeight;
			const bannerWidth = Math.min(tableWidth, legacyLogoWidth + Math.max(line1Width, line2Width)) * 0.85;
			const bannerHeight = bannerWidth / aspectRatio;
			await svg2pdf(svgData.svg, doc, {
				x: margin - 6,
				y: headerStartY - 15,
				width: bannerWidth,
				height: bannerHeight,
			});
		} catch (error) {
			console.error("Failed to load banner SVG:", error);
		}

		const rightX = pageWidth - margin;
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9.5);
		let rightY = headerStartY + 14;
		doc.setFont("helvetica", "normal");
		const rawTitle = (payloadData.customerTitle || "").trim();
		const clientName = (payloadData.customerName || "").trim();
		const namePart = clientName ? clientName.toUpperCase() : "-";
		const titlePart = rawTitle ? rawTitle.toUpperCase() : "";
		const formattedName = titlePart
			? `CLIENT: ${titlePart} ${namePart}`
			: `CLIENT: ${namePart}`;
		doc.text(formattedName, rightX, rightY, { align: "right" });
		rightY += 14;
		// Add location below CLIENT
		const locationText = (payloadData.location || "").trim();
		if (locationText) {
			doc.text(`LOCATION: ${locationText}`, rightX, rightY, { align: "right" });
			rightY += 14;
		}
		doc.text(
			payloadData.docType === "invoice" ? (payloadData.sourceDocNumber || "-") : (payloadData.docNumber || "-"),
			rightX,
			rightY,
			{ align: "right" }
		);
		rightY += 14;
		if (payloadData.docType === "invoice") {
			doc.text(payloadData.docNumber || "-", rightX, rightY, { align: "right" });
			rightY += 14;
		}
		doc.setFont("helvetica", "normal");
		doc.text(formatLongDate(payloadData.quoteDate) || "-", rightX, rightY, { align: "right" });

		try {
			const watermarkData = await loadImageForPdf("/branding/logo.png", 800, 0.85);
			const watermarkWidth = pageWidth * 0.75;
			const aspectRatio = watermarkData.width / watermarkData.height;
			const watermarkHeight = watermarkWidth / aspectRatio;
			const centerX = (pageWidth - watermarkWidth) / 2;
			const centerY = (pageHeight - watermarkHeight) / 2 - 40;
			if (doc.setGState && doc.GState) {
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
		} catch (error) {
			console.error("Failed to load watermark PNG:", error);
		}

		y += 90 + 42;

		doc.setFont("helvetica", "bold");
		doc.setFontSize(h2Size);
		const centerTitle = payloadData.docType === "invoice" ? "SERVICE INVOICE" : "SERVICE QUOTATION";
		doc.text(centerTitle, pageWidth / 2, y, { align: "center" });

		y += 26;
		y += 24;

		const headerRowPadding = 8;
		const headerRowHeight = h3Size + headerRowPadding * 2 + 4;
		const headerRadius = 6;
		doc.setFillColor(247, 171, 26);
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
		const payableHeight = 92;

		// Two-column area below items: left = 60%, right = 40% with gap between columns
		const columnGap = 12; // same gap used between rows
		const leftColWidth = Math.floor(tableWidth * 0.6) - Math.floor(columnGap / 2);
		const rightColWidth = tableWidth - leftColWidth - columnGap;
		const leftX = margin;
		const rightXCol = margin + leftColWidth + columnGap;

		// Stack payable above terms in the left column
		const payableY = footerY - 12 - (payableHeight + 12 + termsHeight);
		const termsY = payableY + payableHeight + 12;

		const payloadTotals = payloadData.totals || calculateTotals(payloadData.items);
		payloadData.items.forEach((item) => {
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

		doc.text("Subtotal", margin + colWidths[0] + colWidths[1] + 32, y + 12);
		doc.text(formatCurrency(payloadTotals.subtotal), margin + colWidths[0] + colWidths[1] + colWidths[2] + 32, y + 12);

		if (payloadData.docType === "invoice" && payloadData.downpaymentValue != null && payloadData.downpaymentValue !== 0) {
			y += 16;
			doc.text("Downpayment", margin + colWidths[0] + colWidths[1] + 32, y + 12);
			doc.text(formatCurrency(payloadTotals.downpayment), margin + colWidths[0] + colWidths[1] + colWidths[2] + 32, y + 12);

			y += 16;
			doc.text("Balance Due", margin + colWidths[0] + colWidths[1] + 32, y + 12);
			doc.text(formatCurrency(payloadTotals.balance), margin + colWidths[0] + colWidths[1] + colWidths[2] + 32, y + 12);
		} else {
			y += 16;
			doc.text("Grand Total", margin + colWidths[0] + colWidths[1] + 32, y + 12);
			doc.text(formatCurrency(payloadTotals.grandTotal), margin + colWidths[0] + colWidths[1] + colWidths[2] + 32, y + 12);
		}

		// Left column background blocks (Payable + Terms)
		doc.setFillColor(0, 0, 0);
		doc.setGState(new doc.GState({ opacity: 0.05 }));
		doc.roundedRect(leftX, payableY, leftColWidth, payableHeight, footerRadius, footerRadius, "F");
		doc.roundedRect(leftX, termsY, leftColWidth, termsHeight, footerRadius, footerRadius, "F");
		doc.setGState(new doc.GState({ opacity: 1 }));

		// Right column (Comments and Notes) block
		doc.setFillColor(0, 0, 0);
		doc.setGState(new doc.GState({ opacity: 0.05 }));
		const commentsHeight = payableHeight + 12 + termsHeight;
		doc.roundedRect(rightXCol, payableY, rightColWidth, commentsHeight, footerRadius, footerRadius, "F");
		doc.setGState(new doc.GState({ opacity: 1 }));

		// Payable to: single-line with author name
		doc.setFont("helvetica", "bold");
		doc.setFontSize(10.5);
		const payableLabel = `Payable to: ${contents.author.name.full || ""}`.trim();
		doc.text(payableLabel, leftX + 10, payableY + blockPadding + 16);

		// Banks: center within left column and fit to available width
		const bankCount = Math.max(1, bankLines.length);
		const bankColWidth = leftColWidth / bankCount;
		const bankRowY = payableY + blockPadding + 36;
		const bankIcons = await Promise.all(
			bankLines.map(async (bank) => {
				if (!bank.icon) return null;
				const iconPath = bank.icon.startsWith("/") ? bank.icon : `/icon/${bank.icon}`;
				try {
					return await loadImageForPdf(iconPath, 200, 0.85, "PNG");
				} catch (error) {
					return null;
				}
			})
		);

		bankLines.forEach((bank, index) => {
			const colCenter = leftX + bankColWidth * index + bankColWidth / 2;
			const iconData = bankIcons[index];
			let iconWidthTarget = 0;
			let iconHeightTarget = 0;
			if (iconData) {
				iconHeightTarget = 20;
				const aspectRatio = iconData.width / iconData.height;
				iconWidthTarget = iconHeightTarget * aspectRatio;
				const iconX = colCenter - iconWidthTarget / 2;
				doc.addImage(
					iconData.dataUrl,
					"PNG",
					iconX,
					bankRowY - 9,
					iconWidthTarget,
					iconHeightTarget
				);
			}
			doc.setFont("helvetica", "normal");
			doc.setFontSize(9);
			const textX = colCenter;
			const iconSpace = iconHeightTarget || 0;
			const textY = bankRowY + iconSpace + 6; // move text below icons
			doc.text(contents.author.name.base || "", textX, textY, { align: "center" });
			doc.text(bank.number || "", textX, textY + 10, { align: "center" });
		});

		// Terms and conditions in left column (smaller text)
		doc.setFont("helvetica", "bold");
		doc.setFontSize(10.5);
		doc.text("Terms and conditions:", leftX + 10, termsY + blockPadding + 10);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(8);
		const termsLines = ["- All rates quoted are valid for 15 days."];
		if (payloadData.docType === "quotation") {
			termsLines.push("- 50% payment should be done in advance.");
			termsLines.push("- The remaining amount should be paid within 20 days of delivery.");
		}

		if (payloadData.docType === "invoice") {
			if (payloadData.downpaymentValue !== null) {
				const downpaymentAmount = formatCurrency(payloadData.totals.downpayment);
				if (payloadData.downpaymentType === "percentage") {
					termsLines.push(`- A ${payloadData.downpaymentValue}% downpayment of ${downpaymentAmount} is required to proceed.`);
				} else {
					termsLines.push(`- A downpayment of ${downpaymentAmount} is required to proceed.`);
				}
			}
			termsLines.push("- The remaining amount should be paid within 20 days of delivery.");
		}

		let termsYOffset = 0;
		termsLines.forEach((line) => {
			doc.text(line, leftX + 10, termsY + blockPadding + 26 + termsYOffset);
			termsYOffset += 10;
		});

		// Right column: Comments and Notes title (leave content area blank)
		doc.setFont("helvetica", "bold");
		doc.setFontSize(10.5);
		doc.text("Comments and Notes:", rightXCol + 10, payableY + blockPadding + 16);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9);

		// Render comments with accent color
		const commentsText = (payloadData.comments || "").toString();
		if (commentsText) {
			// Accent-strong approximated RGB (mix of hue-jaune and black)
			doc.setTextColor(160, 111, 17);
			const commentsLines = doc.splitTextToSize(commentsText, rightColWidth - 16);
			const commentsStartY = payableY + blockPadding + 32;
			doc.text(commentsLines, rightXCol + 10, commentsStartY);
			// Reset text color
			doc.setTextColor(0, 0, 0);
		}

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

		return doc;
	};

	const buildPreview = async () => {
		const pdfDoc = await createPdfDocument(payload);
		return pdfDoc.output("blob");
	};

	useEffect(() => {
		if (docType === "invoice") {
			if (!invoiceData) {
				setPreviewError(invoiceUploadError || "Upload a quotation JSON file to preview an invoice.");
				setPreviewUrl("");
				setIsPreviewing(false);
				return;
			}
		}

		if (docType === "receipt") {
			if (!receiptData) {
				setPreviewError(receiptUploadError || "Complete the receipt details and upload a JSON file to preview.");
				setPreviewUrl("");
				setIsPreviewing(false);
				return;
			}

			if (!receiptDate || (paymentStatus === "partial" && (!receiptBalanceAmount || !balanceDueDate))) {
				setPreviewError("Complete the receipt details and upload a JSON file to preview.");
				setPreviewUrl("");
				setIsPreviewing(false);
				return;
			}

			if (paymentStatus === "partial" && balanceDueDate < receiptDate) {
				setPreviewError("Balance due date must be on or after the receipt date.");
				setPreviewUrl("");
				setIsPreviewing(false);
				return;
			}
		}

		let isCancelled = false;
		const timeoutId = setTimeout(async () => {
			setIsPreviewing(true);
			try {
				const blob = await buildPreview();
				if (!isCancelled) {
					const nextUrl = URL.createObjectURL(blob);
					setPreviewUrl(nextUrl);
					setPreviewError("");
				}
			} catch (error) {
				console.error("Failed to build preview:", error);
				if (!isCancelled) {
					setPreviewError("Unable to render preview.");
				}
			} finally {
				if (!isCancelled) {
					setIsPreviewing(false);
				}
			}
		}, PREVIEW_DEBOUNCE_MS);

		return () => {
			isCancelled = true;
			clearTimeout(timeoutId);
		};
	}, [payload, docType, invoiceData, receiptData, receiptDate, paymentStatus, receiptBalanceAmount, balanceDueDate]);

	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
			if (attemptedSubmitRef.current) {
				clearTimeout(attemptedSubmitRef.current);
			}
		};
	}, [previewUrl]);

	const handleGenerate = async () => {
		if (!canGenerate) {
			setAttemptedSubmit(true);
			const validationMessage = docType === "invoice"
				? (invoiceUploadError || "Upload a quotation JSON file before generating an invoice.")
				: docType === "receipt"
					? (receiptUploadError || (paymentStatus === "partial" && balanceDueDate < receiptDate
						? "Balance due date must be on or after the receipt date."
						: "Complete all required fields before generating."))
					: "Complete all required fields before generating.";
			setGenerateError(validationMessage);

			if (attemptedSubmitRef.current) clearTimeout(attemptedSubmitRef.current);
			attemptedSubmitRef.current = setTimeout(() => {
				setAttemptedSubmit(false);
			}, 1500);

			return;
		}

		setGenerateError("");
		if (docType === "invoice" && !invoiceData) {
			setGenerateError(invoiceUploadError || "Upload a quotation JSON file before generating an invoice.");
			return;
		}
		if (docType === "receipt") {
			if (!receiptData) {
				setGenerateError(receiptUploadError || "Upload a JSON file before generating a receipt.");
				return;
			}
			if (paymentStatus === "partial" && balanceDueDate < receiptDate) {
				setGenerateError("Balance due date must be on or after the receipt date.");
				return;
			}
		}
		const freshPayload = buildPayload();
		persistSuffix(freshPayload.suffix);
		if (docType === "quotation" || docType === "invoice") {
			downloadJson(freshPayload);
		}
		const doc = await createPdfDocument(freshPayload);
		const safeDocNumber = (freshPayload.docNumber || "document").replace(/[^a-z0-9-]/gi, "_");
		doc.save(`${safeDocNumber}.pdf`);
	};

	if (!isUnlocked) {
		return (
			<>
				<main className={`${styles.main} ${styles.lockMain}`}>
					<div className={styles.lockCard}>
						<h1>Protected access</h1>
						<p>Please enter the password to access the generator.</p>
						<form className={styles.lockForm} onSubmit={handleUnlockSubmit}>
							<label>
								<span>Password</span>
								<input
									type="password"
									value={passwordInput}
									onChange={handlePasswordChange}
									autoFocus
									aria-label="Enter password to unlock generator"
								/>
							</label>
							<button type="submit" className={`${styles.generateButton} ${styles.generateButtonReady}`}>Unlock</button>
							{passwordError && <p className={styles.lockError}>{passwordError}</p>}
						</form>
					</div>
				</main>
			</>
		);
	}

	return (
		<>
			<Header />
			<main className={`${styles.main} pageEnter`}>
				<section className={styles.hero}>
					<p className={styles.kicker}>Generate</p>
				</section>

				<section className={styles.section}>
					<div className={styles.workspace}>
						<div className={styles.formPane}>
							<div className={styles.formCard} suppressHydrationWarning>
								<div className={styles.docTypeRow}>
									<Button
										type="button"
										variant="soft"
										size="sm"
										active={docType === "quotation"}
										className={`${styles.docTypeButton} ${docType === "quotation" ? styles.docTypeButtonActive : ""}`}
										onClick={() => setDocType("quotation")}
									>
										Quotation
									</Button>
									<Button
										type="button"
										variant="soft"
										size="sm"
										active={docType === "invoice"}
										className={`${styles.docTypeButton} ${docType === "invoice" ? styles.docTypeButtonActive : ""}`}
										onClick={() => setDocType("invoice")}
									>
										Invoice
									</Button>
									<Button
										type="button"
										variant="soft"
										size="sm"
										active={docType === "receipt"}
										className={`${styles.docTypeButton} ${docType === "receipt" ? styles.docTypeButtonActive : ""}`}
										onClick={() => setDocType("receipt")}
									>
										Confirm Receipt
									</Button>
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
															setAttemptedSubmit(false);
														}}
														onFocus={() => setShowSuggestions(true)}
														placeholder="Enter client"														className={attemptedSubmit && !customerName.trim() ? styles.inputError : ""}														required
													/>
													{showSuggestions && filteredCustomers.length > 0 && (
														<div className={styles.suggestions}>
															{filteredCustomers.map((customer) => (
																<Button
																	key={customer.id}
																	type="button"
																	variant="ghost"
																	size="sm"
																	className={styles.suggestionItem}
																	onClick={() => selectCustomer(customer)}
																>
																	<span className={styles.suggestionName}>{formatCustomerDisplay(customer)}</span>
																	<span className={styles.suggestionId}>ID: {customer.id}</span>
																</Button>
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
													required
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
												<span>Location</span>
												<input
													type="text"
													value={location}
													onChange={(e) => setLocation(e.target.value)}
													placeholder="Project location"
													required
													className={attemptedSubmit && !location.trim() ? styles.inputError : ""}
												/>
											</label>
											<label className={styles.inputGroup}>
												<span>Date</span>
												<input
													type="date"
													value={quoteDate}
												onChange={(e) => {
													setQuoteDate(e.target.value);
													setAttemptedSubmit(false);
												}}
													className={attemptedSubmit && !quoteDate ? styles.inputError : ""}
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
														setAttemptedSubmit(false);
													}}
													onBlur={() => {
														if (clientIdInput) {
															setCustomerId(clientIdInput);
														} else {
															setCustomerId("-");
														}
													}}
													placeholder="50~~"
													required
													className={attemptedSubmit && !clientIdInput.trim() ? styles.inputError : ""}
												/>
											</label>
											<label className={styles.inputGroup}>
												<span>{docType === "invoice" ? "Invoice No." : "Quotation No."}</span>
												<input
													type="text"
													value={docNumber}
													readOnly
													placeholder={docType === "quotation" ? docNumberPlaceholder : undefined}
													required
												/>
											</label>
										</div>

										<div className={styles.table}>
											<div className={`${styles.row} ${styles.rowHeader}`}>
												<span>Item</span>
												<span>Qty</span>
												<span>Price</span>
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
															placeholder="Service description"
															required
														/>
														{showItemSuggestions[index] && getFilteredServices(index).length > 0 && (
															<div className={styles.suggestions}>
																{getFilteredServices(index).map((service) => (
																	<Button
																		key={service.id}
																		type="button"
																		variant="ghost"
																		size="sm"
																		className={styles.suggestionItem}
																		onMouseDown={() => selectService(index, service)}
																	>
																		<span className={styles.suggestionName}>{service.name}</span>
																		<span className={styles.suggestionId}>PHP {service.price.toFixed(2)}</span>
																	</Button>
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
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className={styles.removeButton}
														onClick={() => removeItem(index)}
														aria-label="Remove item"
													>
														x
													</Button>
												</div>
											))}
										</div>

										<div className={styles.actionRow}>
											<Button type="button" variant="soft" size="sm" className={styles.addButton} onClick={addItem}>
												Add item
											</Button>
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

									{docType === "receipt" && (
										<div className={styles.formGrid}>
											<label className={styles.inputGroup}>
												<span>Upload quotation or invoice JSON</span>
												<input
													type="file"
													accept="application/json"
													onChange={handleReceiptFile}
												/>
												{receiptFileName && (
													<span className={styles.fileHint}>{receiptFileName}</span>
												)}
											</label>
											<label className={styles.inputGroup}>
												<span>Amount paid</span>
												<input
													type="number"
													step="0.01"
													value={receiptAmountPaid}
													onChange={(e) => setReceiptAmountPaid(e.target.value)}
													placeholder="Enter amount paid"
												/>
											</label>
											<label className={styles.inputGroup}>
												<span>Full payment?</span>
												<input
													type="checkbox"
													checked={paymentStatus === "full"}
													onChange={(e) => {
														const nextStatus = e.target.checked ? "full" : "partial";
														setPaymentStatus(nextStatus);
														if (nextStatus === "full") {
															setReceiptBalanceAmount("");
														}
													}}
												/>
											</label>
											{paymentStatus === "partial" && (
												<>
													<label className={styles.inputGroup}>
														<span>Balance amount</span>
														<input
															type="number"
															value={receiptBalanceAmount}
															readOnly
															placeholder="Auto-calculated balance"
														/>
													</label>
													<label className={styles.inputGroup}>
														<span>Balance due date</span>
														<input
															type="date"
															value={balanceDueDate}
															onChange={(e) => {
																setBalanceDueDate(e.target.value);
																setAttemptedSubmit(false);
															}}
														/>
													</label>
												</>
											)}
											<label className={styles.inputGroup}>
												<span>Receipt date</span>
												<input
													type="date"
													value={receiptDate}
													onChange={(e) => {
														setReceiptDate(e.target.value);
														setAttemptedSubmit(false);
													}}
												/>
											</label>
										</div>
									)}

									{docType !== "receipt" && (
										<label className={styles.inputGroup}>
											<span>Comments and Notes</span>
											<textarea
												value={comments}
												onChange={(e) => setComments(e.target.value)}
												placeholder="Add comments or notes here"
												rows={4}
											/>
										</label>
									)}

									<button
										type="button"
										className={`${styles.generateButton} ${canGenerate ? styles.generateButtonReady : ""}`}
										onClick={handleGenerate}
										aria-disabled={!canGenerate}
									>
										Generate
									</button>
									{generateError && <p className={styles.generateError}>{generateError}</p>}
								</div>
							</div>

							<aside className={styles.previewPane} aria-live="polite">
								<div className={styles.previewHeader}>
								{isPreviewing && <span className={styles.previewStatus}>Updating…</span>}
							</div>
							{previewError ? (
								<div className={styles.previewEmpty}>{previewError}</div>
							) : previewUrl ? (
								<iframe
									className={styles.previewFrame}
									src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=page-fit`}
									title="PDF preview"
								/>
							) : (
								<div className={styles.previewEmpty}>Start typing to generate a preview.</div>
							)}
						</aside>
					</div>
				</section>
			</main>
			<Footer />
		</>
	);
}
