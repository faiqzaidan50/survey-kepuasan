"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

type Row = { id: string; created_at: string; rating: number; suggestion: string | null };

const PAGE_SIZE = 20;

const LABELS: Record<number, string> = {
    1: "😡 Buruk",
    2: "😕 Kurang",
    3: "🙂 Cukup",
    4: "😊 Baik",
    5: "😍 Sangat Baik",
};

const PRESETS = [
    { key: "today", label: "Hari ini" },
    { key: "7d", label: "7 hari" },
    { key: "30d", label: "30 hari" },
    { key: "custom", label: "Custom" },
] as const;

type PresetKey = (typeof PRESETS)[number]["key"];

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString();
}

function startOfDayLocal(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function toDateInput(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function parseDateInput(v: string) {
    // input type="date" is local date; create local midnight
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    dt.setHours(0, 0, 0, 0);
    return dt;
}

function matchesLocalFilter(
    row: Row,
    ratingFilter: number | "all",
    q: string,
    fromISO: string,
    toExclusiveISO: string
) {
    const okRating = ratingFilter === "all" ? true : row.rating === ratingFilter;

    const keyword = q.trim().toLowerCase();
    const okSearch = !keyword ? true : (row.suggestion || "").toLowerCase().includes(keyword);

    const t = row.created_at; // ISO string from DB
    const okDate = t >= fromISO && t < toExclusiveISO;

    return okRating && okSearch && okDate;
}

export default function ResultsPage() {
    // Date filters
    const [preset, setPreset] = useState<PresetKey>("7d");
    const [fromDate, setFromDate] = useState<string>(() => {
        const today = startOfDayLocal(new Date());
        const d = new Date(today.getTime() - 6 * 86400000);
        return toDateInput(d);
    });
    const [toDate, setToDate] = useState<string>(() => toDateInput(new Date()));

    // Other filters
    const [rows, setRows] = useState<Row[]>([]);
    const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
    const [q, setQ] = useState("");
    const [qDebounced, setQDebounced] = useState("");

    // UI state
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(0); // 0-based
    const [hasMore, setHasMore] = useState(true);

    // Apply preset -> update date inputs
    useEffect(() => {
        const now = new Date();
        const today = startOfDayLocal(now);

        if (preset === "today") {
            setFromDate(toDateInput(today));
            setToDate(toDateInput(now));
        } else if (preset === "7d") {
            const d = new Date(today.getTime() - 6 * 86400000);
            setFromDate(toDateInput(d));
            setToDate(toDateInput(now));
        } else if (preset === "30d") {
            const d = new Date(today.getTime() - 29 * 86400000);
            setFromDate(toDateInput(d));
            setToDate(toDateInput(now));
        }
    }, [preset]);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setQDebounced(q), 300);
        return () => clearTimeout(t);
    }, [q]);

    // Compute ISO bounds for DB filter (inclusive start, exclusive end)
    const dateBounds = useMemo(() => {
        const from = parseDateInput(fromDate);
        const to = parseDateInput(toDate);
        const toExclusive = new Date(to.getTime() + 86400000);

        return {
            fromISO: from.toISOString(),
            toExclusiveISO: toExclusive.toISOString(),
        };
    }, [fromDate, toDate]);

    async function fetchPage(nextPage: number, mode: "reset" | "append") {
        setErr(null);

        const fromIdx = nextPage * PAGE_SIZE;
        const toIdx = fromIdx + PAGE_SIZE - 1;

        let query = supabase
            .from("survey_responses")
            .select("id, created_at, rating, suggestion")
            .order("created_at", { ascending: false })
            .gte("created_at", dateBounds.fromISO)
            .lt("created_at", dateBounds.toExclusiveISO)
            .range(fromIdx, toIdx);

        if (ratingFilter !== "all") query = query.eq("rating", ratingFilter);

        const keyword = qDebounced.trim();
        if (keyword) query = query.ilike("suggestion", `%${keyword}%`);

        const { data, error } = await query;

        if (error) {
            setErr(error.message);
            if (mode === "reset") setRows([]);
            setHasMore(false);
            return;
        }

        const incoming = (data || []) as Row[];

        if (mode === "reset") {
            setRows(incoming);
        } else {
            setRows((prev) => {
                const seen = new Set(prev.map((x) => x.id));
                return [...prev, ...incoming.filter((x) => !seen.has(x.id))];
            });
        }

        setHasMore(incoming.length === PAGE_SIZE);
    }

    async function loadReset() {
        setLoading(true);
        setPage(0);
        await fetchPage(0, "reset");
        setLoading(false);
    }

    async function loadMore() {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        const next = page + 1;
        await fetchPage(next, "append");
        setPage(next);
        setLoadingMore(false);
    }

    // Reload when filters change
    useEffect(() => {
        loadReset();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ratingFilter, qDebounced, dateBounds.fromISO, dateBounds.toExclusiveISO]);

    // Realtime: insert -> prepend if matches current filters
    const latestFilterRef = useRef({
        ratingFilter,
        qDebounced,
        fromISO: dateBounds.fromISO,
        toExclusiveISO: dateBounds.toExclusiveISO,
    });

    useEffect(() => {
        latestFilterRef.current = {
            ratingFilter,
            qDebounced,
            fromISO: dateBounds.fromISO,
            toExclusiveISO: dateBounds.toExclusiveISO,
        };
    }, [ratingFilter, qDebounced, dateBounds.fromISO, dateBounds.toExclusiveISO]);

    useEffect(() => {
        const channel = supabase
            .channel("survey-results-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "survey_responses" },
                (payload) => {
                    const newRow = payload.new as Row;
                    const f = latestFilterRef.current;

                    if (!matchesLocalFilter(newRow, f.ratingFilter, f.qDebounced, f.fromISO, f.toExclusiveISO)) return;

                    setRows((prev) => {
                        if (prev.some((x) => x.id === newRow.id)) return prev;
                        const next = [newRow, ...prev];
                        return next.slice(0, 500);
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const stats = useMemo(() => {
        const total = rows.length;
        const avg = total ? rows.reduce((a, b) => a + b.rating, 0) / total : 0;
        return { total, avg };
    }, [rows]);

    function exportPDF() {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const autoTable = require("jspdf-autotable").default;

        const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

        const title = "Hasil Survey Kepuasan";
        const subtitle = `Periode: ${fromDate} s/d ${toDate}  •  Rating: ${ratingFilter === "all" ? "Semua" : LABELS[ratingFilter]
            }  •  Search: ${qDebounced ? `"${qDebounced}"` : "-"}`;

        // Header
        doc.setFontSize(16);
        doc.text(title, 14, 16);

        doc.setFontSize(10);
        doc.text(subtitle, 14, 22);

        doc.setFontSize(10);
        doc.text(`Total (ter-load): ${stats.total}`, 14, 28);
        doc.text(`Rata-rata (ter-load): ${stats.avg.toFixed(2)}`, 14, 33);

        // Data untuk tabel (pakai data yang sedang tampil/ter-load)
        const body = rows.map((r, i) => [
            String(i + 1),
            formatDateTime(r.created_at),
            LABELS[r.rating],
            r.suggestion?.trim() ? r.suggestion : "—",
        ]);

        autoTable(doc, {
            startY: 40,
            head: [["No", "Waktu", "Rating", "Saran"]],
            body,
            styles: {
                fontSize: 9,
                cellPadding: 2.5,
                valign: "top",
            },
            headStyles: {
                fontStyle: "bold",
            },
            columnStyles: {
                0: { cellWidth: 10 },  // No
                1: { cellWidth: 35 },  // Waktu
                2: { cellWidth: 30 },  // Rating
                3: { cellWidth: 110 }, // Saran
            },
            didDrawPage: (data: any) => {
                // Footer (page number)
                const pageCount = doc.getNumberOfPages();
                doc.setFontSize(9);
                doc.text(
                    `Page ${pageCount}`,
                    doc.internal.pageSize.getWidth() - 20,
                    doc.internal.pageSize.getHeight() - 10
                );
            },
        });

        doc.save("hasil-survey.pdf");
    }

    function exportExcel() {
        const sheetData = rows.map((r) => ({
            waktu: formatDateTime(r.created_at),
            rating: r.rating,
            emoticon: LABELS[r.rating],
            saran: r.suggestion ?? "",
        }));
        const ws = XLSX.utils.json_to_sheet(sheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "responses");
        XLSX.writeFile(wb, "hasil-survey.xlsx");
    }

    return (
        <main className="space-y-4">
            {/* Header + actions */}
            <section className="rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Results</h2>
                        <p className="text-sm text-slate-600">
                            Total (ter-load): <span className="font-semibold">{stats.total}</span> · Rata-rata:{" "}
                            <span className="font-semibold">{stats.avg.toFixed(2)}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={loadReset}
                            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/5 hover:bg-slate-50"
                        >
                            Refresh
                        </button>
                        <button
                            onClick={exportPDF}
                            className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                        >
                            Export PDF
                        </button>
                        <button
                            onClick={exportExcel}
                            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                        >
                            Export Excel
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    {/* Date preset */}
                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                        <div className="text-xs font-semibold text-slate-600">Filter Tanggal</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {PRESETS.map((p) => (
                                <button
                                    key={p.key}
                                    onClick={() => setPreset(p.key)}
                                    className={[
                                        "rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-black/5",
                                        preset === p.key ? "bg-indigo-600 text-white" : "bg-slate-50 hover:bg-slate-100",
                                    ].join(" ")}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <div>
                                <div className="mb-1 text-[11px] text-slate-500">Dari</div>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => {
                                        setPreset("custom");
                                        setFromDate(e.target.value);
                                    }}
                                    className="w-full rounded-xl bg-slate-50 p-2 text-xs ring-1 ring-black/5"
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-[11px] text-slate-500">Sampai</div>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => {
                                        setPreset("custom");
                                        setToDate(e.target.value);
                                    }}
                                    className="w-full rounded-xl bg-slate-50 p-2 text-xs ring-1 ring-black/5"
                                />
                            </div>
                        </div>
                        <div className="mt-2 text-[11px] text-slate-500">
                            Note: “Sampai” termasuk hari itu (kita pakai batas eksklusif +1 hari).
                        </div>
                    </div>

                    {/* Rating filter */}
                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                        <div className="text-xs font-semibold text-slate-600">Filter Rating</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <button
                                onClick={() => setRatingFilter("all")}
                                className={[
                                    "rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-black/5",
                                    ratingFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-50 hover:bg-slate-100",
                                ].join(" ")}
                            >
                                Semua
                            </button>

                            {[1, 2, 3, 4, 5].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRatingFilter(r)}
                                    className={[
                                        "rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-black/5",
                                        ratingFilter === r ? "bg-indigo-600 text-white" : "bg-slate-50 hover:bg-slate-100",
                                    ].join(" ")}
                                >
                                    {LABELS[r]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                        <div className="text-xs font-semibold text-slate-600">Search Saran</div>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder='contoh: "antri", "ramah", "bersih"'
                            className="mt-2 w-full rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        <div className="mt-2 text-[11px] text-slate-500">
                            Search memfilter data (server-side), pagination tetap rapi.
                        </div>
                    </div>
                </div>

                {loading && <p className="mt-4 text-sm text-slate-600">Loading...</p>}
                {err && <p className="mt-4 text-sm text-rose-700">{err}</p>}
            </section>

            {/* Table */}
            <section className="rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">Tabel Hasil Survey</h3>
                    <span className="text-xs text-slate-500">menampilkan {rows.length} data</span>
                </div>

                {!rows.length && !loading ? (
                    <p className="text-sm text-slate-500">Belum ada data untuk filter ini.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] border-separate border-spacing-0">
                                <thead>
                                    <tr className="text-left text-xs text-slate-600">
                                        <th className="sticky top-0 bg-white/70 px-4 py-3 font-semibold">No</th>
                                        <th className="sticky top-0 bg-white/70 px-4 py-3 font-semibold">Waktu</th>
                                        <th className="sticky top-0 bg-white/70 px-4 py-3 font-semibold">Rating</th>
                                        <th className="sticky top-0 bg-white/70 px-4 py-3 font-semibold">Saran</th>
                                    </tr>
                                </thead>

                                <tbody className="text-sm">
                                    {rows.map((r, idx) => (
                                        <tr key={r.id} className="border-t border-slate-200/70">
                                            <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                                            <td className="px-4 py-3 text-slate-700">{formatDateTime(r.created_at)}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-black/5">
                                                    {LABELS[r.rating]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {r.suggestion?.trim() ? r.suggestion : <span className="text-slate-400 italic">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-xs text-slate-500">
                                Menampilkan {rows.length} data {hasMore ? "(masih ada lagi)" : "(sudah paling akhir)"}
                            </div>

                            <button
                                onClick={loadMore}
                                disabled={!hasMore || loadingMore || loading}
                                className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {loadingMore ? "Loading..." : "Load 20 lagi"}
                            </button>
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}
