import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api/axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

const OrderTrackingPage = () => {
    const { orderNumber: urlOrderNumber } = useParams();
    const invoiceRef = useRef(null);

    const [searchInput, setSearchInput] = useState(urlOrderNumber || '');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);

    const [homeQrImage, setHomeQrImage] = useState('');
    const [trackQrImage, setTrackQrImage] = useState('');

    const fetchOrderDetails = async (targetNumber) => {
        if (!targetNumber || !targetNumber.trim()) return;

        setLoading(true);
        try {
            const { data } = await API.get(`/orders/track/${targetNumber.trim()}`);
            if (data.success) {
                setOrder(data.order);
            } else {
                setOrder(null);
                toast.error(data.message || 'Order not found');
            }
        } catch (err) {
            setOrder(null);
            console.error("Tracking lookup error:", err);
            toast.error(err.response?.data?.message || 'No order found with that reference code.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (urlOrderNumber) {
            setSearchInput(urlOrderNumber);
            fetchOrderDetails(urlOrderNumber);
        }
    }, [urlOrderNumber]);

    useEffect(() => {
        if (order && order.order_number) {
            const generateReceiptQRs = async () => {
                try {
                    const originUrl = window.location.origin;

                    const homeData = await QRCode.toDataURL(originUrl, { margin: 1, width: 80 });
                    setHomeQrImage(homeData);

                    const trackingUrl = `${originUrl}/track/${order.order_number}`;
                    const trackData = await QRCode.toDataURL(trackingUrl, { margin: 1, width: 80 });
                    setTrackQrImage(trackData);
                } catch (err) {
                    console.error("Failed generating QR images", err);
                }
            };
            generateReceiptQRs();
        }
    }, [order]);

    const handleManualSearch = (e) => {
        e.preventDefault();
        fetchOrderDetails(searchInput);
    };

    const formatStatus = (status) => {
        if (!status) return 'Pending';
        return status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatPaymentMethod = (method) => {
        if (!method) return 'N/A';
        return method
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const downloadPDF = async () => {
        const element = invoiceRef.current;
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');

            // 1. Standard fixed width for A4 (210mm)
            const pdfWidthMm = 210;
            const marginMm = 10;
            const printableWidthMm = pdfWidthMm - (marginMm * 2); // 190mm

            /* 2. Calculate the EXACT dynamic height needed in millimeters.
               Formula: (Canvas Height * Printable Width) / Canvas Width
               We add 20mm extra for top/bottom margins so nothing touches the edge.
            */
            const printableHeightMm = (canvas.height * printableWidthMm) / canvas.width;
            const pdfHeightMm = printableHeightMm + (marginMm * 2);

            // 3. Create the PDF with your custom, auto-calculated dimensions
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [pdfWidthMm, pdfHeightMm] // Dynamic [Width, Height] array
            });

            // 4. Print the entire image perfectly onto the single customized page
            pdf.addImage(imgData, 'PNG', marginMm, marginMm, printableWidthMm, printableHeightMm);

            pdf.save(`Receipt-${order?.order_number || 'MK'}.pdf`);
            toast.success('Receipt downloaded successfully!');
        } catch (error) {
            console.error("Download failed:", error);
            toast.error('Could not generate receipt.');
        }
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 transition-colors duration-300" style={{ background: 'var(--bg-deep)' }}>
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-main)' }}>Track Your Order</h1>
                    <p className="text-sm text-gray-500">Enter the order identifier from your bill</p>
                </div>

                <form onSubmit={handleManualSearch} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        className="form-input flex-1 input-field"
                        placeholder="e.g., MK-2172"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button type="submit" disabled={loading} className="btn-primary px-6 whitespace-nowrap">
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {order && (
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={downloadPDF}
                            className="btn-primary flex items-center gap-2 text-xs py-2 px-4 rounded-[7px] shadow-md"
                        >
                            Download Receipt
                        </button>
                    </div>
                )}

                {/* ========================================================= */}
                {/* 1. FRONTEND USER INTERFACE SCREEN CARD VIEW               */}
                {/* ========================================================= */}
                {order && (
                    <div
                        className="card p-6 sm:p-8 space-y-6 transition-all duration-300"
                        style={{
                            background: 'var(--bg-card)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-main)',
                            boxShadow: 'var(--shadow)'
                        }}
                    >
                        <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                            <div>
                                <p className="text-xs uppercase text-gray-400 font-bold tracking-wider">Order Reference</p>
                                <h3 className="text-2xl font-black mt-0.5" style={{ color: 'var(--primary)' }}>#{order.order_number}</h3>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatDateTime(order.created_at)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-1">Status</p>
                                <span className={`status-badge status-${order.status || 'pending'}`}>
                                    {formatStatus(order.status)}
                                </span>
                            </div>
                        </div>

                        {/* Customer & Delivery Information Grid */}
                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm p-5 rounded-[7px] border transition-all"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
                        >
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Customer</p>
                                <p className="font-semibold text-base mt-0.5" style={{ color: 'var(--text-main)' }}>{order.full_name || order.customer_name || 'Guest User'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Contact Phone</p>
                                <p className="font-semibold text-base mt-0.5" style={{ color: 'var(--text-main)' }}>{order.phone || order.customer_phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Email Address</p>
                                <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--text-main)' }}>{order.email || order.customer_email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Payment Method</p>
                                <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--text-main)' }}>{formatPaymentMethod(order.payment_method)}</p>
                            </div>
                            <div className="sm:col-span-2 border-t pt-3 mt-1" style={{ borderColor: 'var(--border)' }}>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Delivery Area / Region</p>
                                <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--text-main)' }}>
                                    {order.delivery_area_name || (!order.delivery_area || order.delivery_area === 'N/A' ? 'Standard Delivery' : order.delivery_area)}
                                </p>
                            </div>
                            <div className="col-span-1 sm:col-span-2 border-t pt-3 mt-1" style={{ borderColor: 'var(--border)' }}>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Complete Destination Address</p>
                                <p className="font-bold text-sm mt-0.5" style={{ color: 'var(--text-main)' }}>{order.address || 'Standard Pickup'}</p>
                            </div>
                            {(order.additional_instructions || order.instructions) && (
                                <div className="col-span-1 sm:col-span-2 border-t pt-3 mt-1" style={{ borderColor: 'var(--border)' }}>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Special Instructions</p>
                                    <p className="text-sm mt-0.5 text-gray-600" style={{ color: 'var(--text-main)' }}>{order.additional_instructions || order.instructions}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-xs uppercase text-gray-400 font-bold mb-3 tracking-wider border-b pb-2" style={{ borderColor: 'var(--border)' }}>Items Ordered</p>
                            <div className="hidden sm:grid grid-cols-12 text-xs font-bold uppercase text-gray-400 pb-2 px-2">
                                <div className="col-span-6">Item Description</div>
                                <div className="col-span-2 text-center">Price</div>
                                <div className="col-span-2 text-center">Qty</div>
                                <div className="col-span-2 text-right">Total</div>
                            </div>

                            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                {order.items?.map((item, index) => {
                                    const itemName = item.product_name || item.name || item.item_name || "Delicious Item";
                                    const itemQuantity = Number(item.quantity || item.qty || 1);
                                    // Aligned directly with backend database fields
                                    const itemPrice = Number(item.unit_price ?? item.item_price ?? item.price ?? 0);
                                    const rowTotal = item.total_price ? Number(item.total_price) : (itemPrice * itemQuantity);

                                    return (
                                        <div key={index} className="py-3 px-2 text-sm">
                                            {/* Mobile layout */}
                                            <div className="sm:hidden flex flex-col gap-1">
                                                <div className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>{itemName}</div>
                                                <div className="flex justify-between items-center text-xs mt-0.5 text-gray-500">
                                                    <span>Rs. {itemPrice.toLocaleString()} x {itemQuantity}</span>
                                                    <span className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>Rs. {rowTotal.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Desktop/Tablet grid layout */}
                                            <div className="hidden sm:grid grid-cols-12 items-center gap-0">
                                                <div className="col-span-6 font-semibold" style={{ color: 'var(--text-main)' }}>{itemName}</div>
                                                <div className="col-span-2 text-center text-gray-500">Rs. {itemPrice.toLocaleString()}</div>
                                                <div className="col-span-2 text-center text-gray-500">{itemQuantity}</div>
                                                <div className="col-span-2 text-right font-bold" style={{ color: 'var(--text-main)' }}>Rs. {rowTotal.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="border-t mt-6 pt-4 space-y-3 text-sm" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex justify-between items-center text-gray-500">
                                <span>Subtotal:</span>
                                <span className="font-semibold" style={{ color: 'var(--text-main)' }}>
                                    Rs. {Number(order.subtotal || 0).toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-gray-500">
                                <span>Delivery Charges:</span>
                                <span className="font-semibold" style={{ color: 'var(--text-main)' }}>
                                    Rs. {Number(order.delivery_charge || 0).toLocaleString()}
                                </span>
                            </div>

                            {/* Grand Total now reflects Subtotal only */}
                            <div className="flex justify-between items-center font-bold text-lg border-t pt-3 mt-2" style={{ borderColor: 'var(--border)' }}>
                                <span style={{ color: 'var(--text-main)' }}>Grand Total:</span>
                                <span className="text-2xl font-black" style={{ color: 'var(--primary)' }}>
                                    Rs. {Number(order.total || (Number(order.subtotal || 0) + Number(order.delivery_charge || 0))).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* 2. DEDICATED INVOICE PRINT TEMPLATE (OFF-SCREEN VIEW)     */}
                {/* ========================================================= */}
                {order && (
                    <div
                        ref={invoiceRef}
                        style={{
                            position: 'absolute',
                            left: '-9999px',
                            top: '0',
                            width: '700px',
                            padding: '45px',
                            backgroundColor: '#ffffff',
                            color: '#1e293b',
                            fontFamily: "'Poppins', sans-serif",
                            pointerEvents: 'none',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ef4444', paddingBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <img
                                    src="/logo.png"
                                    alt="Logo"
                                    style={{ height: '55px', width: 'auto', objectFit: 'contain' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <div>
                                    <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#990000', margin: 0, letterSpacing: '-0.5px' }}>
                                        MUNE'S KITCHEN
                                    </h1>
                                    <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Frozen Freshness Delivered Right To Your Table
                                    </p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h2 style={{ fontSize: '12px', fontWeight: '700', margin: 0, color: '#64748b', letterSpacing: '0.5px' }}>OFFICIAL INVOICE RECEIPT</h2>
                                <p style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: '4px 0 0 0' }}>
                                    ID: <span style={{ color: '#ef4444' }}>{order.order_number}</span>
                                </p>
                            </div>
                        </div>

                        <div style={{ margin: '25px 0', padding: '20px', backgroundColor: '#fef2f2', borderLeft: '4px solid #990000', borderRadius: '7px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#990000' }}>
                                Thank You for Your Order!
                            </h3>
                            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#7f1d1d', lineHeight: '1.5' }}>
                                We appreciate your preference for Mune's Kitchen. Your order has been registered securely and our kitchen team is currently preparing it using fresh ingredients.
                            </p>
                        </div>

                        {/* Customer Profile Layout Formatted & Fixed Fields */}
                        <div style={{ display: 'table', width: '100%', margin: '25px 0', border: '1px solid #e2e8f0', borderRadius: '7px', overflow: 'hidden' }}>
                            <div style={{ display: 'table-row', backgroundColor: '#f8fafc' }}>
                                <div style={{ display: 'table-cell', padding: '12px 15px', width: '50%', borderBottom: '1px solid #e2e8f0', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                                    Customer & Destination Profile
                                </div>
                                <div style={{ display: 'table-cell', padding: '12px 15px', width: '50%', borderBottom: '1px solid #e2e8f0', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                                    Transaction Information
                                </div>
                            </div>
                            <div style={{ display: 'table-row' }}>
                                <div style={{ display: 'table-cell', padding: '15px', borderRight: '1px solid #e2e8f0', fontSize: '13px', verticalAlign: 'top' }}>
                                    <strong style={{ color: '#0f172a', fontSize: '14px' }}>{order.full_name || order.customer_name || 'Valued Customer'}</strong>

                                    <div style={{ marginTop: '10px' }}>
                                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Email Address:</span>
                                        <strong style={{ color: '#0f172a', fontWeight: '700' }}>{order.email || order.customer_email || 'N/A'}</strong>
                                    </div>

                                    <div style={{ marginTop: '10px' }}>
                                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Delivery Area / Region:</span>
                                        <strong style={{ color: '#0f172a', fontWeight: '700' }}>
                                            {order.delivery_area_name || (!order.delivery_area || order.delivery_area === 'N/A' ? 'Standard Delivery' : order.delivery_area)}
                                        </strong>
                                    </div>

                                    <div style={{ marginTop: '10px' }}>
                                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Shipping Address:</span>
                                        <strong style={{ color: '#0f172a', fontWeight: '700', display: 'inline-block', marginTop: '2px' }}>
                                            {order.address || 'Counter Pickup Location'}
                                        </strong>
                                    </div>

                                    {(order.additional_instructions || order.instructions) && (
                                        <div style={{ marginTop: '10px' }}>
                                            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Instructions:</span>
                                            <span style={{ color: '#475569', fontSize: '12px' }}>{order.additional_instructions || order.instructions}</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'table-cell', padding: '15px', fontSize: '13px', verticalAlign: 'top' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Phone Number:</span>
                                        <strong style={{ fontWeight: '700', color: '#0f172a' }}>{order.phone || order.customer_phone || 'N/A'}</strong>
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Payment Method:</span>
                                        <strong style={{ fontWeight: '700', color: '#0f172a' }}>{formatPaymentMethod(order.payment_method)}</strong>
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Order Date:</span>
                                        <strong style={{ fontWeight: '700', color: '#0f172a' }}>{formatDateTime(order.created_at)}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '30px' }}>
                            <div style={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
                                <div style={{ display: 'table-row', backgroundColor: '#0f172a', color: '#ffffff' }}>
                                    <div style={{ display: 'table-cell', padding: '10px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', borderRadius: '7px 0 0 7px' }}>Item Description</div>
                                    <div style={{ display: 'table-cell', padding: '10px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' }}>Unit Price</div>
                                    <div style={{ display: 'table-cell', padding: '10px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' }}>Quantity</div>
                                    <div style={{ display: 'table-cell', padding: '10px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right', borderRadius: '0 7px 7px 0' }}>Total</div>
                                </div>

                                {order.items?.map((item, index) => {
                                    const itemName = item.product_name || item.name || item.item_name || "Delicious Item";
                                    const itemQuantity = Number(item.quantity || item.qty || 1);
                                    // FIXED: Swapped out broken pricing variables with core DB parameters
                                    const itemPrice = Number(item.unit_price ?? item.item_price ?? item.price ?? 0);
                                    const rowTotal = item.total_price ? Number(item.total_price) : (itemPrice * itemQuantity);

                                    return (
                                        <div key={index} style={{ display: 'table-row', borderBottom: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'table-cell', padding: '12px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{itemName}</div>
                                            <div style={{ display: 'table-cell', padding: '12px', fontSize: '13px', color: '#475569', textAlign: 'center' }}>Rs. {itemPrice.toLocaleString()}</div>
                                            <div style={{ display: 'table-cell', padding: '12px', fontSize: '13px', color: '#475569', textAlign: 'center', fontWeight: '700' }}>{itemQuantity}</div>
                                            <div style={{ display: 'table-cell', padding: '12px', fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>Rs. {rowTotal.toLocaleString()}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ marginTop: '25px', borderTop: '2px solid #e2e8f0', paddingTop: '15px', width: '280px', marginLeft: 'auto' }}>
                            {/* Items Subtotal */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                                <span>Items Subtotal:</span>
                                <span style={{ fontWeight: '600', color: '#0f172a' }}>Rs. {Number(order.subtotal || 0).toLocaleString()}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                                <span>Delivery Fee:</span>
                                <span style={{ fontWeight: '600', color: '#0f172a' }}>
                                    Rs. {Number(order.delivery_charge || 0).toLocaleString()}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                                <span style={{ color: '#0f172a' }}>Grand Total:</span>
                                <span style={{ color: '#990000', fontSize: '18px' }}>
                                    Rs. {Number(order.total || (Number(order.subtotal || 0) + Number(order.delivery_charge || 0))).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '45px', borderTop: '2px dashed #cbd5e1', paddingTop: '20px' }}>
                            <div style={{ flex: 1, paddingRight: '20px' }}>
                                <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>Scan to track updates live:</strong>
                                <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                                    Use your smartphone camera to scan the tracking QR code. It safely directs you straight to our server to view real-time production status updates.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ textAlign: 'center', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '7px', border: '1px solid #e2e8f0' }}>
                                    {homeQrImage && <img src={homeQrImage} alt="Main App QR" style={{ width: '65px', height: '65px' }} />}
                                    <span style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: '#64748b', marginTop: '4px', textTransform: 'uppercase' }}>Our Menu</span>
                                </div>
                                <div style={{ textAlign: 'center', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '7px', border: '1px solid #e2e8f0' }}>
                                    {trackQrImage && <img src={trackQrImage} alt="Track Order QR" style={{ width: '65px', height: '65px' }} />}
                                    <span style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#990000', marginTop: '4px', textTransform: 'uppercase' }}>Track Live</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>
                                This is a computer-generated official receipt invoice for Mune's Kitchen order transactions.
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default OrderTrackingPage;