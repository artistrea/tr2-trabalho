import Head from "next/head";
import { type EventHandler, type FormEvent, useRef, useState } from "react";
import { Navbar } from "~/components/navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/accordion";

import { api, baseApi, type TanksWithLatestSample } from "~/utils/api";
import { useMapWithMarkers } from "~/utils/map/use-map-with-markers";
import { useProtectedRoute } from "~/utils/use-protected-route";
import Link from "next/link";
import { Skeleton } from "~/components/skeleton";
import { toLonLat } from "ol/proj";
import { type MapBrowserEvent } from "ol";
import { getVolume } from "~/utils/get-volume";

function pointsToClassifiedPointsMapper(
  points: undefined | TanksWithLatestSample[],
) {
  const prio = { danger: 2, warning: 1, normal: 0 };

  return points
    ?.map((p) => {
      console.log("p", p);
      return {
        ...p,
        current_volume: getVolume(p),
        type:
          getVolume(p) <= p.volume_danger_zone
            ? ("danger" as const)
            : getVolume(p) <= p.volume_alert_zone
              ? ("warning" as const)
              : ("normal" as const),
        lat: p.latitude,
        long: p.longitude,
      };
    })
    .sort((a, b) =>
      prio[a.type] > prio[b.type] ? -1 : prio[a.type] < prio[b.type] ? 1 : 0,
    );
}

export default function MapPage() {
  useProtectedRoute();
  const mapRef = useRef<HTMLDivElement>(null);

  const { data: points, isLoading } =
    api.tank.getAllWithLatestSample.useQuery();
  const mappedPoints = pointsToClassifiedPointsMapper(points);

  const [selectedId, setSelectedId] = useState(points?.[0]?.id);

  const [editEnable, setEditEnable] = useState(false);

  const tempId = -1;
  const [name, setTankName] = useState("");
  const [lat, setTankLat] = useState(0);
  const [long, setTankLong] = useState(0);
  const [maximumVolume, setTankMaximumVolume] = useState(0);
  const [dangerZone, setTankDangerZone] = useState(0);
  const [alertZone, setTankAlertZone] = useState(0);
  const [tankBaseArea, setTankBaseArea] = useState(0);

  const handleCreate: EventHandler<FormEvent> = (e) => {
    if (!name && !maximumVolume && !dangerZone && !alertZone && !tankBaseArea) {
      alert("Preencha todos os campos");
    } else if (!lat && !long) {
      alert("Selecione uma localização no mapa");
    } else {
      baseApi
        .post("/tanks", {
          name: name,
          description: name,
          maximum_volume: maximumVolume,
          volume_danger_zone: dangerZone,
          volume_alert_zone: alertZone,
          tank_base_area: tankBaseArea, //TODO: como criar isso e se volume atual faz sentido perguntar
          latitude: long, //TODO: long e lat foram invertidos, no codigo todo, inclusive funcoes to/fromLongLat
          longitude: lat,
        })
        .then((res) => {
          location.reload();
          //refetch
        })
        .catch((e) => alert(e));
    }
    e.preventDefault();
  };

  useMapWithMarkers(
    mappedPoints,
    mapRef,
    selectedId,
    (ints: number[]) => {
      setSelectedId(ints[0]);
    },
    editEnable
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: MapBrowserEvent<any>) => {
          const [newLong, newLat] = toLonLat(e.coordinate);
          setTankLat(newLat ?? 0);
          setTankLong(newLong ?? 0);
          setSelectedId(tempId); // deixar o marcador temporário em destaque
          e.preventDefault();
          return tempId;
        }
      : undefined,
  );

  return (
    <>
      <Head>
        <title>UnB - Trabalho de TR2</title>
        <meta name="description" content="Trabalho de TR2" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center bg-zinc-800">
          <div className="flex w-full">
            <Accordion
              type="single"
              collapsible
              className="flex max-h-[40rem] w-[40%] flex-col gap-4 overflow-scroll"
              value={selectedId?.toString()}
              onValueChange={(v) => {
                setSelectedId(Number(v));
                setEditEnable(v === tempId.toString());
              }}
            >
              {!isLoading &&
                mappedPoints?.map((p) => (
                  <AccordionItem
                    data-type={p.type}
                    className="rounded border-l-2 border-l-green-600 p-2 data-[type=danger]:border-l-red-600 data-[type=warning]:border-l-yellow-600"
                    key={p.id}
                    value={p.id.toString()}
                  >
                    <AccordionTrigger>{p.name}</AccordionTrigger>
                    <AccordionContent className="flex flex-col">
                      <div>
                        Id do tanque: {p.id}
                        <br />
                        {p.current_volume}/{p.maximum_volume} litros
                      </div>
                      <Link
                        href={`/tanks/chart?includeTankId=${p.id}`}
                        className="w-max place-self-end px-2"
                      >
                        Ver Histórico
                      </Link>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              <AccordionItem
                className="border-l-white-600 rounded border-l-2 p-2"
                key={tempId}
                value={tempId.toString()}
              >
                <AccordionTrigger>{"+ Novo tanque"}</AccordionTrigger>
                <AccordionContent className="flex flex-col">
                  <form onSubmit={handleCreate}>
                    <div className="m-1">
                      <label className="m-1">
                        Nome:
                        <input
                          className="m-1 border-b bg-zinc-800"
                          type="text"
                          name="nome"
                          value={name}
                          onChange={(e) => setTankName(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="m-1">
                      <label className="m-1">
                        Volume Máximo(litros):
                        <input
                          className="m-1 border-b bg-zinc-800"
                          type="number"
                          min="0"
                          name="volumeMaximo"
                          defaultValue={maximumVolume}
                          onChange={(e) =>
                            setTankMaximumVolume(parseInt(e.target.value))
                          }
                        />
                      </label>
                    </div>
                    <div className="m-1">
                      <label className="m-1">
                        Zona de alerta(litros):
                        <input
                          className="m-1 border-b bg-zinc-800"
                          type="number"
                          min="0"
                          max={maximumVolume}
                          name="zonaAlerta"
                          value={alertZone}
                          onChange={(e) =>
                            setTankAlertZone(parseInt(e.target.value))
                          }
                        />
                      </label>
                    </div>
                    <div className="m-1">
                      <label className="m-1">
                        Zona de Perigo(litros):
                        <input
                          className="m-1 border-b bg-zinc-800"
                          type="number"
                          min="0"
                          max={alertZone}
                          name="zonaPerigo"
                          value={dangerZone}
                          onChange={(e) =>
                            setTankDangerZone(parseInt(e.target.value))
                          }
                        />
                      </label>
                    </div>
                    <div className="m-1">
                      <label className="m-1">
                        Área da Base do tanque(m²):
                        <input
                          className="m-1 border-b bg-zinc-800"
                          type="number"
                          min="0"
                          name="tank_base_area"
                          value={tankBaseArea}
                          onChange={(e) =>
                            setTankBaseArea(parseInt(e.target.value))
                          }
                        />
                      </label>
                    </div>
                    <div className="m-1">
                      <label className="m-1">
                        Localização:
                        <input
                          className="m-1 bg-zinc-800"
                          disabled={true}
                          type="text"
                          name="localização"
                          value={"Selecione no mapa"}
                        />
                      </label>
                    </div>
                    <button className="mt-3 bg-zinc-700 p-1" type="submit">
                      Criar
                    </button>
                  </form>
                </AccordionContent>
              </AccordionItem>
              {isLoading &&
                Array.from({ length: 8 })?.map((p, i) => (
                  <AccordionItem
                    disabled
                    className="relative p-2"
                    key={i}
                    value={""}
                  >
                    <AccordionTrigger>
                      <div className="flex">
                        <Skeleton className="absolute bottom-0 left-0 top-0 w-1"></Skeleton>
                        <Skeleton className="h-6 w-16 py-2"></Skeleton>
                      </div>
                    </AccordionTrigger>
                  </AccordionItem>
                ))}
            </Accordion>
            <div
              data-loading={isLoading}
              className="relative h-[40rem] w-[60%] overflow-hidden rounded"
            >
              {isLoading && <Skeleton className="absolute inset-0" />}

              <div
                className="h-full w-full bg-white data-[loading='true']:hidden"
                data-loading={isLoading}
                ref={mapRef}
              ></div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
