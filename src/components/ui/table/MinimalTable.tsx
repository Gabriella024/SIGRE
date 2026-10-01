import React, { useEffect, useMemo, useRef, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	Pencil,
	Trash2,
} from "lucide-react";
import type { ColumnAlign, MinimalTableProps, RowId, SortDirection } from "./types";

const ALIGN_TEXT: Record<ColumnAlign, string> = {
	left: "text-left",
	center: "text-center",
	right: "text-right",
};

const ALIGN_FLEX: Record<ColumnAlign, string> = {
	left: "justify-start",
	center: "justify-center",
	right: "justify-end",
};

function compareValues(a: unknown, b: unknown): number {
	if (a == null && b == null) return 0;
	if (a == null) return 1;
	if (b == null) return -1;
	if (typeof a === "number" && typeof b === "number") return a - b;
	return String(a).localeCompare(String(b), "es", { sensitivity: "base", numeric: true });
}

function SortableHeader({
	label,
	active,
	direction,
	onClick,
}: {
	label: string;
	active: boolean;
	direction: SortDirection;
	onClick: () => void;
}) {
	const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
	return (
		<button
			type="button"
			onClick={onClick}
			className={`inline-flex items-center gap-1.5 rounded transition-colors hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${active ? "text-slate-900" : ""
				}`}
		>
			{label}
			<Icon className={`h-3.5 w-3.5 ${active ? "text-slate-700" : "text-slate-400"}`} />
		</button>
	);
}

export default function MinimalTable<T extends { id: RowId }>({
	data,
	columns,
	pageSize = 5,
	onEdit,
	onDelete,
	onSelectionChange,
}: MinimalTableProps<T>) {
	const [sort, setSort] = useState<{ key: string; dir: SortDirection } | null>(null);
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState<Set<RowId>>(new Set());
	const headerCheckboxRef = useRef<HTMLInputElement>(null);

	const sorted = useMemo(() => {
		if (!sort) return data;
		const factor = sort.dir === "asc" ? 1 : -1;
		return [...data].sort(
			(a, b) =>
				factor *
				compareValues(
					(a as Record<string, unknown>)[sort.key],
					(b as Record<string, unknown>)[sort.key]
				)
		);
	}, [data, sort]);

	const total = sorted.length;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const currentPage = Math.min(page, totalPages);
	const startIndex = (currentPage - 1) * pageSize;
	const pageRows = sorted.slice(startIndex, startIndex + pageSize);

	useEffect(() => {
		if (page > totalPages) setPage(totalPages);
	}, [page, totalPages]);

	const pageSelectedCount = pageRows.filter((r) => selected.has(r.id)).length;
	const allPageSelected = pageRows.length > 0 && pageSelectedCount === pageRows.length;
	const somePageSelected = pageSelectedCount > 0 && !allPageSelected;

	useEffect(() => {
		if (headerCheckboxRef.current) headerCheckboxRef.current.indeterminate = somePageSelected;
	}, [somePageSelected]);

	const updateSelection = (next: Set<RowId>) => {
		setSelected(next);
		onSelectionChange?.(Array.from(next));
	};

	const toggleAllPage = () => {
		const next = new Set(selected);
		if (allPageSelected) pageRows.forEach((r) => next.delete(r.id));
		else pageRows.forEach((r) => next.add(r.id));
		updateSelection(next);
	};

	const toggleRow = (id: RowId) => {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		updateSelection(next);
	};

	const handleSort = (key: string) => {
		setSort((prev) =>
			prev?.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
		);
		setPage(1);
	};

	const from = total === 0 ? 0 : startIndex + 1;
	const to = Math.min(startIndex + pageSize, total);

	const thBase = "px-4 py-3 text-xs font-semibold text-slate-500";
	const checkboxClass =
		"h-4 w-4 cursor-pointer rounded border-slate-300 accent-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400";

	return (
		<div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
			<div className="overflow-x-auto">
				<table className="w-full border-collapse text-sm">
					<thead>
						<tr className="border-b border-slate-200 bg-white">
							<th scope="col" className="w-12 px-4 py-3">
								<input
									ref={headerCheckboxRef}
									type="checkbox"
									className={checkboxClass}
									checked={allPageSelected}
									onChange={toggleAllPage}
									aria-label="Seleccionar todas las filas de esta página"
								/>
							</th>

							{columns.map((col) => {
								const align = col.align ?? "left";
								const isActive = sort?.key === col.key;
								return (
									<th
										key={col.key}
										scope="col"
										aria-sort={
											isActive ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined
										}
										className={`${thBase} ${ALIGN_TEXT[align]}`}
									>
										{col.sortable ? (
											<div className={`flex ${ALIGN_FLEX[align]}`}>
												<SortableHeader
													label={col.label}
													active={isActive}
													direction={sort?.dir ?? "asc"}
													onClick={() => handleSort(col.key)}
												/>
											</div>
										) : (
											col.label
										)}
									</th>
								);
							})}

							<th scope="col" className={`${thBase} text-right uppercase tracking-wider`}>
								ACCIONES
							</th>
						</tr>
					</thead>

					<tbody>
						{pageRows.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length + 2}
									className="px-4 py-12 text-center text-slate-400"
								>
									No hay registros para mostrar.
								</td>
							</tr>
						) : (
							pageRows.map((item) => {
								const isSelected = selected.has(item.id);
								return (
									<tr
										key={item.id}
										className={`border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50 ${isSelected ? "bg-slate-50" : "bg-white"
											}`}
									>
										<td className="w-12 px-4 py-3">
											<input
												type="checkbox"
												className={checkboxClass}
												checked={isSelected}
												onChange={() => toggleRow(item.id)}
												aria-label={`Seleccionar fila ${item.id}`}
											/>
										</td>

										{columns.map((col) => (
											<td
												key={col.key}
												className={`px-4 py-3 text-slate-600 ${ALIGN_TEXT[col.align ?? "left"]}`}
											>
												{col.render
													? col.render(item)
													: String((item as Record<string, unknown>)[col.key] ?? "")}
											</td>
										))}

										<td className="px-4 py-3">
											<div className="flex items-center justify-end gap-1">
												<button
													type="button"
													onClick={() => onEdit?.(item)}
													aria-label="Editar"
													title="Editar"
													className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
												>
													<Pencil className="h-4 w-4" />
												</button>
												<button
													type="button"
													onClick={() => onDelete?.(item)}
													aria-label="Eliminar"
													title="Eliminar"
													className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			<div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm italic text-slate-500">
					Mostrando {from} a {to} de {total} registros en total
				</p>

				<div className="flex items-center gap-2">
					<span className="text-xs text-slate-400">
						Página {currentPage} de {totalPages}
					</span>
					<button
						type="button"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={currentPage === 1}
						aria-label="Página anterior"
						className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
					>
						<ChevronLeft className="h-4 w-4" />
					</button>
					<button
						type="button"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={currentPage === totalPages}
						aria-label="Página siguiente"
						className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	);
}