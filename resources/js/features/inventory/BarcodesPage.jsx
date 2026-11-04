import React, { useState, useEffect, useRef } from 'react';
import { 
    Barcode, 
    Search, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    ArrowLeftRight, 
    Printer, 
    BookOpen, 
    User, 
    Calendar,
    RefreshCw,
    Check
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { copiesService } from '../../services/copiesService';
import { loansService } from '../../services/loansService';
import { useToast } from '../../app/ToastContext';
import { formatDate } from '../../lib/utils';

export default function BarcodesPage({ onNavigateToLoan }) {
    const { showToast } = useToast();
    const inputRef = useRef(null);

    const [barcodeQuery, setBarcodeQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [scannedCopy, setScannedCopy] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [returnLoading, setReturnLoading] = useState(false);

    // Focus input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Perform barcode lookup
    const handleScan = async (e) => {
        if (e) e.preventDefault();
        const code = barcodeQuery.trim();
        if (!code) return;

        try {
            setLoading(true);
            setScanError(null);
            const copy = await copiesService.getByBarcode(code);
            setScannedCopy(copy);

            // Add to session scan history
            setScanHistory((prev) => {
                const filtered = prev.filter((item) => item.barcode !== copy.barcode);
                return [copy, ...filtered].slice(0, 8);
            });

            showToast(`Found copy: ${copy.barcode}`, 'success');
        } catch (err) {
            setScannedCopy(null);
            setScanError(err.message || `No book copy found with barcode "${code}"`);
            showToast('Barcode not found', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Quick Return if currently borrowed
    const handleQuickReturn = async () => {
        if (!scannedCopy || !scannedCopy.active_loan) return;

        try {
            setReturnLoading(true);
            await loansService.returnLoan(scannedCopy.active_loan.id);
            showToast('Book successfully returned to inventory!', 'success');
            
            // Refresh scanned copy details
            const updated = await copiesService.getByBarcode(scannedCopy.barcode);
            setScannedCopy(updated);
        } catch (err) {
            showToast(err.message || 'Failed to return book', 'error');
        } finally {
            setReturnLoading(false);
        }
    };

    // Quick Print
    const handlePrintBarcode = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Barcode className="w-7 h-7 text-blue-600" />
                    Barcode Scanner & Circulation Station
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Scan or type physical barcodes to instantly look up copies, check circulation status, and execute rapid returns.
                </p>
            </div>

            {/* Scanner Input Station Card */}
            <Card className="p-6 border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
                <form onSubmit={handleScan} className="max-w-2xl mx-auto space-y-4">
                    <div className="text-center space-y-1 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                            Hardware Scanner Ready
                        </span>
                        <h3 className="text-lg font-extrabold text-slate-900">
                            Scan Barcode Gun or Enter Manually
                        </h3>
                        <p className="text-xs text-slate-500">
                            Works with standard USB & Bluetooth barcode scanners (sends Enter automatically).
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Barcode className="w-5 h-5" />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={barcodeQuery}
                                onChange={(e) => setBarcodeQuery(e.target.value)}
                                placeholder="Scan or enter barcode (e.g. LIB-9X8K2M1A)..."
                                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-blue-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 text-base font-mono font-bold tracking-wider text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 outline-hidden transition-all bg-white"
                                autoFocus
                            />
                        </div>
                        <Button 
                            type="submit" 
                            variant="primary" 
                            size="lg" 
                            loading={loading}
                            icon={Search}
                        >
                            Lookup
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Scanned Copy Result Card */}
            {scannedCopy && (
                <Card className="p-6 border-l-4 border-l-blue-600">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                                        {scannedCopy.barcode}
                                    </span>
                                    <Badge 
                                        variant={scannedCopy.is_available ? 'success' : 'warning'} 
                                        dot
                                    >
                                        {scannedCopy.is_available ? 'AVAILABLE ON SHELF' : 'CURRENTLY BORROWED'}
                                    </Badge>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mt-1">
                                    {scannedCopy.book?.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Authors: {scannedCopy.book?.authors || 'N/A'} • ISBN: {scannedCopy.book?.isbn || 'N/A'} • Category: {scannedCopy.book?.category?.name || 'General'}
                                </p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            {scannedCopy.is_available ? (
                                onNavigateToLoan && (
                                    <Button
                                        variant="primary"
                                        icon={ArrowLeftRight}
                                        onClick={() => onNavigateToLoan(scannedCopy)}
                                    >
                                        Issue to Member
                                    </Button>
                                )
                            ) : (
                                <Button
                                    variant="success"
                                    icon={CheckCircle2}
                                    loading={returnLoading}
                                    onClick={handleQuickReturn}
                                >
                                    Process Return Now
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                icon={Printer}
                                onClick={handlePrintBarcode}
                            >
                                Print Label
                            </Button>
                        </div>
                    </div>

                    {/* Copy Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-sm">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Condition & Quality
                            </span>
                            <span className="font-bold text-slate-900 capitalize text-base">
                                {scannedCopy.condition || 'Good'}
                            </span>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Physical Inventory ID
                            </span>
                            <span className="font-mono font-bold text-slate-900 text-base">
                                #{scannedCopy.id}
                            </span>
                        </div>

                        {scannedCopy.active_loan ? (
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                                    Active Borrower
                                </span>
                                <span className="font-bold text-amber-950 block">
                                    {scannedCopy.active_loan.user?.name || 'Unknown User'}
                                </span>
                                <span className="text-xs text-amber-700">
                                    Due: {formatDate(scannedCopy.active_loan.due_date)}
                                </span>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                                    Shelf Status
                                </span>
                                <span className="font-bold text-emerald-950">
                                    Ready for checkout
                                </span>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Error banner */}
            {scanError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                        <p className="text-sm font-bold">{scanError}</p>
                        <p className="text-xs text-rose-600 mt-0.5">
                            Make sure the copy is registered in the Inventory page before scanning.
                        </p>
                    </div>
                </div>
            )}

            {/* Recent Session Scan History */}
            {scanHistory.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        Recently Scanned in this Session
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {scanHistory.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setScannedCopy(item)}
                                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs cursor-pointer transition-all space-y-1"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-bold text-slate-800">
                                        {item.barcode}
                                    </span>
                                    <Badge size="xs" variant={item.is_available ? 'success' : 'warning'}>
                                        {item.is_available ? 'Avail' : 'Loaned'}
                                    </Badge>
                                </div>
                                <p className="text-xs font-semibold text-slate-900 truncate">
                                    {item.book?.title}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

