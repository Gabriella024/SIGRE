import { Info } from 'lucide-react';

export function RecommendationPanel() {
  const recommendations = [
    {
      num: 1,
      title: 'Conserva los encabezados',
      desc: 'No cambies ni elimines los nombres de las columnas de la plantilla.',
    },
    {
      num: 2,
      title: 'Revisa los documentos',
      desc: 'Verifica que cada número esté completo y no tenga puntos ni espacios.',
    },
    {
      num: 3,
      title: 'Una persona por fila',
      desc: 'No combines celdas y evita dejar filas vacías entre los registros.',
    },
  ];

  return (
    <aside className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 grid place-items-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-sm text-slate-900">
          Recomendaciones para tu archivo
        </h3>
      </div>

      <p className="text-xs text-slate-500">
        Ten en cuenta estos consejos antes de cargarlo.
      </p>

      <div className="space-y-3 divide-y divide-slate-100">
        {recommendations.map((rec) => (
          <div key={rec.num} className="flex gap-3 pt-3 first:pt-0">
            <span className="grid place-items-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] shrink-0">
              {rec.num}
            </span>
            <div className="text-xs space-y-0.5">
              <strong className="block text-slate-800 font-semibold">{rec.title}</strong>
              <span className="text-slate-500 leading-relaxed block">{rec.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 text-amber-900 rounded-lg p-3 text-[11px] border border-amber-200/60 leading-relaxed">
        La información será tratada según la política de protección de datos del SENA.
      </div>
    </aside>
  );
}