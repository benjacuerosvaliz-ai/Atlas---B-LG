"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ACTIVITY_LABELS, type OwnedProduct, type TripFormData } from "../types";

type Props = {
  data: TripFormData;
  products: OwnedProduct[];
};

export function StepPreview({ data, products }: Props) {
  const productsTagged = products.filter((p) => data.productIds.includes(p.id));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
          Último vistazo
        </span>
        <h2 className="font-display text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">
          Revisá antes de publicar.
        </h2>
      </div>

      <dl className="flex flex-col gap-6">
        <Row label="Inicio">
          {data.startPlace ? data.startPlace.name : "—"}
        </Row>
        {data.endPlace && (
          <Row label="Destino">{data.endPlace.name}</Row>
        )}
        <Row label="Fecha">
          {data.startAt
            ? format(new Date(data.startAt), "d 'de' MMMM, yyyy", { locale: es })
            : "—"}
          {data.endAt &&
            ` → ${format(new Date(data.endAt), "d 'de' MMMM, yyyy", { locale: es })}`}
        </Row>
        <Row label="Actividad">
          {data.activityType ? ACTIVITY_LABELS[data.activityType] : "—"}
        </Row>
        <Row label="Distancia">
          <span className="font-mono tabular-nums">
            {data.distanceKm?.toLocaleString("es-CL") ?? "—"} km
          </span>
        </Row>
        {data.elevationGainM ? (
          <Row label="Desnivel positivo">
            <span className="font-mono tabular-nums">
              {data.elevationGainM.toLocaleString("es-CL")} m
            </span>
          </Row>
        ) : null}
        <Row label="Fotos">
          <span className="font-mono">{data.photos.length} subidas</span>
        </Row>
        <Row label="BØLG vinculados">
          {productsTagged.length === 0 ? (
            <span className="text-foreground/40">Ninguno</span>
          ) : (
            <span className="flex flex-wrap gap-2">
              {productsTagged.map((p) => (
                <span
                  key={p.id}
                  className="border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
                >
                  {p.givenName ?? p.modelName}
                </span>
              ))}
            </span>
          )}
        </Row>
      </dl>

      {data.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {data.photos.map((p) => (
            <div
              key={p.publicId}
              className="aspect-square overflow-hidden bg-fog"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-baseline sm:gap-8">
      <dt className="w-44 shrink-0 text-[10px] uppercase tracking-[0.32em] text-foreground/45">
        {label}
      </dt>
      <dd className="text-base">{children}</dd>
    </div>
  );
}
