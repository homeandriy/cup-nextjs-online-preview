'use client';

import {Canvas, useLoader} from '@react-three/fiber';
import {Bounds, Environment, OrbitControls} from '@react-three/drei';
import type {KonvaEventObject} from 'konva/lib/Node';
import type {Image as KonvaImageNode} from 'konva/lib/shapes/Image';
import type {Text as KonvaTextNode} from 'konva/lib/shapes/Text';
import type {Stage as KonvaStage} from 'konva/lib/Stage';
import type {Transformer as KonvaTransformer} from 'konva/lib/shapes/Transformer';
import {useLocale, useTranslations} from 'next-intl';
import {Suspense, useEffect, useId, useMemo, useRef, useState} from 'react';
import {
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text as KonvaText,
  Transformer
} from 'react-konva';
import * as THREE from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import useImage from 'use-image';

import {SiteNav} from '@/components/site-nav';

const PRINT_DPI = 300;
const EDITOR_DPI = 120;
const MILLIMETERS_IN_INCH = 25.4;
const DEFAULT_TEXT_COLOR = '#1f2937';

type MugType = 'classic11oz' | 'rimRed' | 'large15oz' | 'spoonHandle';
type MugModelFormat = 'glb' | 'gltf' | 'fbx' | 'obj';
type DesignLayerType = 'image' | 'text';

type MugSpec = {
  id: MugType;
  titleKey: string;
  summaryKey: string;
  capacityLabel: string;
  templateWidthMm: number;
  templateHeightMm: number;
  handleSafeZoneMm: number;
  bodyColor: string;
  accentColor?: string;
  bodyHeight: number;
  radiusTop: number;
  radiusBottom: number;
  previewScale: number;
  spoon?: boolean;
};

type BaseLayer = {
  id: string;
  type: DesignLayerType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
};

type ImageLayer = BaseLayer & {
  type: 'image';
  src: string;
};

type TextLayer = BaseLayer & {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  align: 'left' | 'center' | 'right';
};

type DesignLayer = ImageLayer | TextLayer;

type FontOption = {
  id: string;
  family: string;
  label: string;
};

const FONT_OPTIONS: FontOption[] = [
  {id: 'inter', family: 'Inter', label: 'Inter'},
  {id: 'rubik', family: 'Rubik', label: 'Rubik'},
  {id: 'nunito', family: 'Nunito', label: 'Nunito'},
  {id: 'montserrat', family: 'Montserrat', label: 'Montserrat'},
  {id: 'open-sans', family: 'Open Sans', label: 'Open Sans'},
  {id: 'lora', family: 'Lora', label: 'Lora'},
  {id: 'playfair-display', family: 'Playfair Display', label: 'Playfair Display'},
  {id: 'oswald', family: 'Oswald', label: 'Oswald'},
  {id: 'pt-serif', family: 'PT Serif', label: 'PT Serif'},
  {id: 'roboto-slab', family: 'Roboto Slab', label: 'Roboto Slab'}
];

const MUG_SPECS: MugSpec[] = [
  {
    id: 'classic11oz',
    titleKey: 'classic11oz.title',
    summaryKey: 'classic11oz.summary',
    capacityLabel: '11 Oz',
    templateWidthMm: 210,
    templateHeightMm: 90,
    handleSafeZoneMm: 10,
    bodyColor: '#fffdf8',
    bodyHeight: 2.35,
    radiusTop: 1.23,
    radiusBottom: 1.16,
    previewScale: 1
  },
  {
    id: 'rimRed',
    titleKey: 'rimRed.title',
    summaryKey: 'rimRed.summary',
    capacityLabel: '11 Oz',
    templateWidthMm: 210,
    templateHeightMm: 90,
    handleSafeZoneMm: 10,
    bodyColor: '#fffdf8',
    accentColor: '#dc2626',
    bodyHeight: 2.35,
    radiusTop: 1.23,
    radiusBottom: 1.16,
    previewScale: 1
  },
  {
    id: 'large15oz',
    titleKey: 'large15oz.title',
    summaryKey: 'large15oz.summary',
    capacityLabel: '15 Oz',
    templateWidthMm: 230,
    templateHeightMm: 100,
    handleSafeZoneMm: 10,
    bodyColor: '#fffaf0',
    bodyHeight: 2.7,
    radiusTop: 1.34,
    radiusBottom: 1.26,
    previewScale: 1.08
  },
  {
    id: 'spoonHandle',
    titleKey: 'spoonHandle.title',
    summaryKey: 'spoonHandle.summary',
    capacityLabel: '12 Oz',
    templateWidthMm: 205,
    templateHeightMm: 92,
    handleSafeZoneMm: 10,
    bodyColor: '#fffbf5',
    accentColor: '#f59e0b',
    bodyHeight: 2.42,
    radiusTop: 1.24,
    radiusBottom: 1.18,
    previewScale: 1,
    spoon: true
  }
];

function resolveAssetSource(source: string | undefined) {
  if (!source) {
    return null;
  }

  if (source.startsWith('http://') || source.startsWith('https://') || source.startsWith('/')) {
    return source;
  }

  return `/${source}`;
}

function inferMugModelFormat(source: string | null): MugModelFormat | null {
  if (!source) {
    return null;
  }

  const normalizedSource = source.toLowerCase();

  if (normalizedSource.endsWith('.glb')) {
    return 'glb';
  }

  if (normalizedSource.endsWith('.gltf')) {
    return 'gltf';
  }

  if (normalizedSource.endsWith('.fbx')) {
    return 'fbx';
  }

  if (normalizedSource.endsWith('.obj')) {
    return 'obj';
  }

  return null;
}

function mmToPixels(mm: number, dpi: number) {
  return Math.round((mm / MILLIMETERS_IN_INCH) * dpi);
}

function getSpec(mugType: MugType) {
  return MUG_SPECS.find((item) => item.id === mugType) ?? MUG_SPECS[0];
}

function getDefaultText(locale: string) {
  if (locale === 'en') {
    return 'Your custom mug';
  }

  if (locale === 'pl') {
    return 'Twój własny kubek';
  }

  return 'Твоя власна кружка';
}

function getLayerKindLabel(t: ReturnType<typeof useTranslations>, layer: DesignLayer) {
  return layer.type === 'text' ? t('layers.kinds.text') : t('layers.kinds.image');
}

export function CreateCupStudio() {
  const t = useTranslations('CreateCupPage');
  const locale = useLocale();
  const inputId = useId();
  const stageRef = useRef<KonvaStage | null>(null);
  const mugListRef = useRef<HTMLDivElement | null>(null);

  const [mugType, setMugType] = useState<MugType>('classic11oz');
  const [layers, setLayers] = useState<DesignLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [previewTextureUrl, setPreviewTextureUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const spec = getSpec(mugType);
  const stageWidth = mmToPixels(spec.templateWidthMm, EDITOR_DPI);
  const stageHeight = mmToPixels(spec.templateHeightMm, EDITOR_DPI);
  const safeZoneWidth = mmToPixels(spec.handleSafeZoneMm, EDITOR_DPI);
  const exportScale = PRINT_DPI / EDITOR_DPI;
  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId) ?? null;

  function normalizeLayerPosition(layer: DesignLayer): DesignLayer {
    const minX = safeZoneWidth;
    const maxX = Math.max(safeZoneWidth, stageWidth - safeZoneWidth - layer.width);
    const minY = 0;
    const maxY = Math.max(0, stageHeight - layer.height);

    return {
      ...layer,
      x: Math.min(Math.max(layer.x, minX), maxX),
      y: Math.min(Math.max(layer.y, minY), maxY)
    };
  }

  useEffect(() => {
    if (!stageRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (!stageRef.current) {
        return;
      }

      setPreviewTextureUrl(
        stageRef.current.toDataURL({
          pixelRatio: 1,
          mimeType: 'image/png'
        })
      );
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [layers, mugType, stageHeight, stageWidth]);

  function chooseMugType(nextType: MugType) {
    setMugType(nextType);
    setLayers([]);
    setSelectedLayerId(null);
    setStatusMessage(null);
    setPreviewTextureUrl('');
  }

  function scrollMugList(direction: 'left' | 'right') {
    mugListRef.current?.scrollBy({
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth'
    });
  }

  function updateLayer(layerId: string, patch: Partial<DesignLayer>) {
    setLayers((current) =>
      current.map((layer) =>
        layer.id === layerId ? normalizeLayerPosition({...layer, ...patch} as DesignLayer) : layer
      )
    );
  }

  function moveLayer(layerId: string, direction: 'up' | 'down') {
    setLayers((current) => {
      const index = current.findIndex((item) => item.id === layerId);

      if (index === -1) {
        return current;
      }

      const targetIndex = direction === 'up' ? index + 1 : index - 1;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  }

  function removeLayer(layerId: string) {
    setLayers((current) => current.filter((layer) => layer.id !== layerId));
    setSelectedLayerId((current) => (current === layerId ? null : current));
  }

  function resetCanvas() {
    setLayers([]);
    setSelectedLayerId(null);
    setStatusMessage(null);
  }

  function handleFilesUpload(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          return;
        }

        const result = reader.result;
        const image = new window.Image();
        image.onload = () => {
          const maxWidth = Math.max(stageWidth - safeZoneWidth * 2, 120);
          const maxHeight = Math.max(stageHeight - 48, 120);
          const fitRatio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
          const width = Math.round(image.width * fitRatio);
          const height = Math.round(image.height * fitRatio);
          const nextLayer: ImageLayer = {
            id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'image',
            name: file.name,
            src: result,
            x: Math.round(safeZoneWidth + (stageWidth - safeZoneWidth * 2 - width) / 2),
            y: Math.round((stageHeight - height) / 2),
            width,
            height,
            rotation: 0,
            opacity: 1
          };

          setLayers((current) => [...current, normalizeLayerPosition(nextLayer)]);
          setSelectedLayerId(nextLayer.id);
          setStatusMessage(null);
        };
        image.src = result;
      };

      reader.readAsDataURL(file);
    });
  }

  function addTextLayer() {
    const defaultFont = FONT_OPTIONS[0]?.family ?? 'Inter';
    const text = getDefaultText(locale);
    const fontSize = 44;
    const width = Math.max(240, stageWidth - safeZoneWidth * 2 - 48);
    const height = Math.round(fontSize * 1.8);
    const nextLayer: TextLayer = {
      id: `${Date.now()}-text-${Math.random().toString(36).slice(2, 8)}`,
      type: 'text',
      name: text,
      text,
      fontFamily: defaultFont,
      fontSize,
      fill: DEFAULT_TEXT_COLOR,
      align: 'center',
      x: Math.round(safeZoneWidth + (stageWidth - safeZoneWidth * 2 - width) / 2),
      y: Math.round((stageHeight - height) / 2),
      width,
      height,
      rotation: 0,
      opacity: 1
    };

    setLayers((current) => [...current, normalizeLayerPosition(nextLayer)]);
    setSelectedLayerId(nextLayer.id);
    setStatusMessage(null);
  }

  async function submitToPrint() {
    if (!stageRef.current) {
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const imageDataUrl = stageRef.current.toDataURL({
        pixelRatio: exportScale,
        mimeType: 'image/png'
      });

      const response = await fetch('/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locale,
          mugType: spec.id,
          imageDataUrl,
          printProfile: {
            dpi: PRINT_DPI,
            templateWidthMm: spec.templateWidthMm,
            templateHeightMm: spec.templateHeightMm,
            safeZoneLeftMm: spec.handleSafeZoneMm,
            safeZoneRightMm: spec.handleSafeZoneMm,
            printableWidthMm: spec.templateWidthMm - spec.handleSafeZoneMm * 2
          }
        })
      });

      const payload = (await response.json()) as {message?: string};

      if (!response.ok) {
        throw new Error(payload.message ?? t('status.errorGeneric'));
      }

      setStatusMessage(payload.message ?? t('status.success'));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t('status.errorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <SiteNav current="create-cup" />

        <section className="rounded-[2rem] border border-orange-200/70 bg-white/90 p-4 shadow-[0_30px_80px_-45px_rgba(234,88,12,0.65)] backdrop-blur sm:p-6 lg:p-8">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px] 2xl:items-start">
            <section className="min-w-0 space-y-4">
              <header className="flex flex-col gap-5 rounded-[1.75rem] border border-orange-100 bg-[linear-gradient(135deg,_rgba(255,247,237,0.96),_rgba(255,255,255,0.96))] p-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-orange-600">
                    {t('eyebrow')}
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h1>
                  <p className="text-sm leading-7 text-slate-600">{t('description')}</p>
                </div>

                <div className="grid gap-2 rounded-[1.25rem] border border-orange-100 bg-white/80 p-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-2">
                  <SpecRow label={t('printSpec.template')} value={`${spec.templateWidthMm} × ${spec.templateHeightMm} mm`} />
                  <SpecRow label={t('printSpec.printable')} value={`${spec.templateWidthMm - spec.handleSafeZoneMm * 2} × ${spec.templateHeightMm} mm`} />
                  <SpecRow label={t('printSpec.margin')} value={`${spec.handleSafeZoneMm} mm`} />
                  <SpecRow label={t('printSpec.dpi')} value={`${PRINT_DPI} DPI`} />
                </div>
              </header>

              <div className="space-y-3 rounded-[1.75rem] border border-orange-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {t('mugSelectorLabel')}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                      {spec.capacityLabel}
                    </span>
                    <button
                      aria-label="Previous mug type"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-white text-lg font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
                      data-testid="mug-scroll-left"
                      onClick={() => scrollMugList('left')}
                      type="button"
                    >
                      ←
                    </button>
                    <button
                      aria-label="Next mug type"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-white text-lg font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
                      data-testid="mug-scroll-right"
                      onClick={() => scrollMugList('right')}
                      type="button"
                    >
                      →
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" ref={mugListRef}>
                  {MUG_SPECS.map((item) => {
                    const isActive = item.id === spec.id;

                    return (
                      <button
                        key={item.id}
                        className={[
                          'min-w-[220px] flex-1 rounded-[1.4rem] border p-4 text-left transition lg:min-w-[260px]',
                          isActive
                            ? 'border-orange-400 bg-orange-50 shadow-[0_18px_40px_-36px_rgba(234,88,12,0.9)]'
                            : 'border-orange-100 bg-white hover:border-orange-300 hover:bg-orange-50/60'
                        ].join(' ')}
                        data-testid={`mug-option-${item.id}`}
                        onClick={() => chooseMugType(item.id)}
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-base text-slate-900">{t(`mugs.${item.titleKey}`)}</strong>
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                            {item.capacityLabel}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{t(`mugs.${item.summaryKey}`)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{t('editor.title')}</h2>
                  <p className="text-sm text-slate-600">{t('editor.description')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    accept="image/*"
                    className="hidden"
                    data-testid="image-input"
                    id={inputId}
                    multiple
                    onChange={(event) => {
                      handleFilesUpload(event.target.files);
                      event.target.value = '';
                    }}
                    type="file"
                  />
                  <button
                    className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                    data-testid="add-image-button"
                    onClick={() => document.getElementById(inputId)?.click()}
                    type="button"
                  >
                    {t('editor.addLayer')}
                  </button>
                  <button
                    className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
                    data-testid="add-text-button"
                    onClick={addTextLayer}
                    type="button"
                  >
                    {t('editor.addText')}
                  </button>
                  <button
                    className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
                    data-testid="clear-design-button"
                    onClick={resetCanvas}
                    type="button"
                  >
                    {t('editor.clear')}
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-[#fffdf9]">
                <div className="border-b border-orange-100 px-4 py-3 text-sm text-slate-600">{t('editor.canvasHelp')}</div>
                <div className="overflow-auto p-3 sm:p-4" data-testid="stage-scroll-container">
                  <div className="inline-block rounded-[1.5rem] border border-dashed border-orange-200 bg-white p-2 sm:p-4" data-testid="stage-wrapper">
                    <Stage
                      data-testid="design-stage"
                      height={stageHeight}
                      onMouseDown={(event) => {
                        if (event.target === event.target.getStage()) {
                          setSelectedLayerId(null);
                        }
                      }}
                      ref={stageRef}
                      width={stageWidth}
                    >
                      <Layer>
                        <Rect fill="#fffdf8" height={stageHeight} stroke="#fed7aa" strokeWidth={2} width={stageWidth} />
                        <Rect fill="rgba(148, 163, 184, 0.14)" height={stageHeight} width={safeZoneWidth} x={0} y={0} />
                        <Rect fill="rgba(148, 163, 184, 0.14)" height={stageHeight} width={safeZoneWidth} x={stageWidth - safeZoneWidth} y={0} />
                        <KonvaText fill="#ea580c" fontSize={22} text={t('editor.safeZoneLabel')} x={18} y={18} />
                        <KonvaText fill="#64748b" fontSize={18} text={t('editor.printableLabel')} x={safeZoneWidth + 16} y={18} />

                        {layers.map((layer) =>
                          layer.type === 'image' ? (
                            <EditableImageLayer
                              isSelected={layer.id === selectedLayerId}
                              key={layer.id}
                              layer={layer}
                              onChange={(patch) => updateLayer(layer.id, patch)}
                              onSelect={() => setSelectedLayerId(layer.id)}
                            />
                          ) : (
                            <EditableTextLayer
                              isSelected={layer.id === selectedLayerId}
                              key={layer.id}
                              layer={layer}
                              onChange={(patch) => updateLayer(layer.id, patch)}
                              onSelect={() => setSelectedLayerId(layer.id)}
                            />
                          )
                        )}
                      </Layer>
                    </Stage>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-orange-100 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{t('layers.title')}</h3>
                    <p className="text-sm text-slate-600">{t('layers.description')}</p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700" data-testid="layers-count">
                    {t('layers.count', {count: layers.length})}
                  </span>
                </div>

                <div className="mt-4 grid gap-3" data-testid="design-layers">
                  {layers.length === 0 ? (
                    <p className="rounded-[1.25rem] border border-dashed border-orange-200 px-4 py-5 text-sm text-slate-500" data-testid="layers-empty">
                      {t('layers.empty')}
                    </p>
                  ) : null}

                  {layers.map((layer, index) => {
                    const isSelected = layer.id === selectedLayerId;

                    return (
                      <button
                        className={[
                          'rounded-[1.25rem] border px-4 py-3 text-left transition',
                          isSelected
                            ? 'border-orange-300 bg-orange-50'
                            : 'border-orange-100 bg-white hover:border-orange-200 hover:bg-orange-50/40'
                        ].join(' ')}
                        data-layer-type={layer.type}
                        data-testid={`layer-item-${index}`}
                        key={layer.id}
                        onClick={() => setSelectedLayerId(layer.id)}
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <strong className="truncate text-sm text-slate-900">{layer.name}</strong>
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">#{index + 1}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">{getLayerKindLabel(t, layer)}</span>
                          <span>{Math.round(layer.width)} × {Math.round(layer.height)} px</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedLayer ? (
                  <div className="mt-5 grid gap-4 rounded-[1.25rem] border border-orange-100 bg-orange-50/50 p-4" data-testid="layer-inspector">
                    {selectedLayer.type === 'text' ? (
                      <>
                        <label className="grid gap-2 text-sm text-slate-700">
                          <span className="font-medium">{t('inspector.text')}</span>
                          <textarea
                            className="min-h-24 rounded-[1rem] border border-orange-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                            data-testid="text-layer-content"
                            onChange={(event) =>
                              updateLayer(selectedLayer.id, {
                                text: event.target.value,
                                name: event.target.value.slice(0, 42) || t('layers.kinds.text'),
                                height: Math.max(selectedLayer.fontSize * 1.7, selectedLayer.height)
                              } as Partial<DesignLayer>)
                            }
                            value={selectedLayer.text}
                          />
                        </label>
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="grid gap-2 text-sm text-slate-700">
                            <span className="font-medium">{t('inspector.font')}</span>
                            <select
                              className="rounded-[1rem] border border-orange-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                              data-testid="text-layer-font"
                              onChange={(event) => updateLayer(selectedLayer.id, {fontFamily: event.target.value} as Partial<DesignLayer>)}
                              value={selectedLayer.fontFamily}
                            >
                              {FONT_OPTIONS.map((font) => (
                                <option key={font.id} value={font.family}>{font.label}</option>
                              ))}
                            </select>
                          </label>
                          <label className="grid gap-2 text-sm text-slate-700">
                            <span className="font-medium">{t('inspector.color')}</span>
                            <input
                              className="h-12 w-full rounded-[1rem] border border-orange-200 bg-white px-2 py-2"
                              data-testid="text-layer-color"
                              onChange={(event) => updateLayer(selectedLayer.id, {fill: event.target.value} as Partial<DesignLayer>)}
                              type="color"
                              value={selectedLayer.fill}
                            />
                          </label>
                        </div>
                        <RangeField
                          label={t('inspector.fontSize')}
                          max={96}
                          min={18}
                          onChange={(value) => updateLayer(selectedLayer.id, {fontSize: value, height: value * 1.8} as Partial<DesignLayer>)}
                          step={1}
                          testId="text-layer-font-size"
                          value={selectedLayer.fontSize}
                        />
                      </>
                    ) : null}

                    <RangeField label={t('inspector.opacity')} max={1} min={0.1} onChange={(value) => updateLayer(selectedLayer.id, {opacity: value})} step={0.05} testId="layer-opacity" value={selectedLayer.opacity} />
                    <RangeField label={t('inspector.rotation')} max={180} min={-180} onChange={(value) => updateLayer(selectedLayer.id, {rotation: value})} step={1} testId="layer-rotation" value={selectedLayer.rotation} />
                    <div className="flex flex-wrap gap-2">
                      <ActionButton label={t('inspector.layerUp')} onClick={() => moveLayer(selectedLayer.id, 'up')} testId="layer-up-button" />
                      <ActionButton label={t('inspector.layerDown')} onClick={() => moveLayer(selectedLayer.id, 'down')} testId="layer-down-button" />
                      <ActionButton destructive label={t('inspector.delete')} onClick={() => removeLayer(selectedLayer.id)} testId="layer-delete-button" />
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <aside className="space-y-4 2xl:sticky 2xl:top-6">
              <div className="rounded-[1.75rem] border border-orange-100 bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{t('preview.title')}</h2>
                    <p className="text-sm text-slate-600">{t('preview.description')}</p>
                  </div>
                  <button
                    className="rounded-full border border-orange-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 sm:text-xs"
                    data-testid="preview-open-fullscreen"
                    onClick={() => setIsPreviewFullscreen(true)}
                    type="button"
                  >
                    {t('preview.fullscreen')}
                  </button>
                </div>

                <PreviewCanvas spec={spec} textureUrl={previewTextureUrl} />
              </div>

              <div className="rounded-[1.75rem] border border-orange-100 bg-slate-950 p-5 text-white">
                <h2 className="text-lg font-semibold">{t('sendBox.title')}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">{t('sendBox.description')}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  <li>{t('sendBox.points.dpi')}</li>
                  <li>{t('sendBox.points.margin')}</li>
                  <li>{t('sendBox.points.format')}</li>
                </ul>
                <button
                  className="mt-5 w-full rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                  data-testid="send-to-print-button"
                  disabled={layers.length === 0 || isSubmitting}
                  onClick={submitToPrint}
                  type="button"
                >
                  {isSubmitting ? t('sendBox.sending') : t('sendBox.submit')}
                </button>
                {statusMessage ? (
                  <p className="mt-4 rounded-[1rem] bg-white/10 px-4 py-3 text-sm text-slate-100" data-testid="status-message">
                    {statusMessage}
                  </p>
                ) : null}
              </div>
            </aside>
          </div>
        </section>
      </div>

      {isPreviewFullscreen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6" data-testid="preview-modal">
          <div className="mx-auto flex h-full max-w-6xl flex-col rounded-[2rem] border border-white/10 bg-white p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{t('preview.title')}</h2>
                <p className="mt-1 text-sm text-slate-600">{t('preview.description')}</p>
              </div>
              <button
                className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
                data-testid="preview-close-fullscreen"
                onClick={() => setIsPreviewFullscreen(false)}
                type="button"
              >
                {t('preview.close')}
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <PreviewCanvas fullscreen spec={spec} textureUrl={previewTextureUrl} />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function EditableImageLayer({
  layer,
  isSelected,
  onSelect,
  onChange
}: {
  layer: ImageLayer;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<DesignLayer>) => void;
}) {
  const [image] = useImage(layer.src, 'anonymous');
  const imageRef = useRef<KonvaImageNode | null>(null);
  const transformerRef = useRef<KonvaTransformer | null>(null);

  useEffect(() => {
    if (!isSelected || !transformerRef.current || !imageRef.current) {
      return;
    }

    transformerRef.current.nodes([imageRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        draggable
        height={layer.height}
        image={image ?? undefined}
        onClick={onSelect}
        onDragEnd={(event: KonvaEventObject<DragEvent>) => {
          onChange({x: event.target.x(), y: event.target.y()});
        }}
        onTap={onSelect}
        onTransformEnd={() => {
          const node = imageRef.current;

          if (!node) {
            return;
          }

          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          node.scaleX(1);
          node.scaleY(1);

          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(24, node.width() * scaleX),
            height: Math.max(24, node.height() * scaleY)
          });
        }}
        opacity={layer.opacity}
        ref={imageRef}
        rotation={layer.rotation}
        width={layer.width}
        x={layer.x}
        y={layer.y}
      />
      {isSelected ? (
        <Transformer
          anchorCornerRadius={999}
          anchorFill="#f97316"
          anchorSize={11}
          borderDash={[4, 4]}
          borderStroke="#ea580c"
          ref={transformerRef}
          rotateAnchorOffset={20}
        />
      ) : null}
    </>
  );
}

function EditableTextLayer({
  layer,
  isSelected,
  onSelect,
  onChange
}: {
  layer: TextLayer;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<DesignLayer>) => void;
}) {
  const textRef = useRef<KonvaTextNode | null>(null);
  const transformerRef = useRef<KonvaTransformer | null>(null);

  useEffect(() => {
    if (!isSelected || !transformerRef.current || !textRef.current) {
      return;
    }

    transformerRef.current.nodes([textRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [isSelected]);

  return (
    <>
      <KonvaText
        align={layer.align}
        draggable
        fill={layer.fill}
        fontFamily={layer.fontFamily}
        fontSize={layer.fontSize}
        height={layer.height}
        onClick={onSelect}
        onDragEnd={(event: KonvaEventObject<DragEvent>) => {
          onChange({x: event.target.x(), y: event.target.y()});
        }}
        onTap={onSelect}
        onTransformEnd={() => {
          const node = textRef.current;

          if (!node) {
            return;
          }

          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const nextFontSize = Math.max(18, Math.round(layer.fontSize * scaleY));

          node.scaleX(1);
          node.scaleY(1);

          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(100, node.width() * scaleX),
            height: Math.max(nextFontSize * 1.5, node.height() * scaleY),
            fontSize: nextFontSize
          } as Partial<DesignLayer>);
        }}
        opacity={layer.opacity}
        padding={8}
        ref={textRef}
        rotation={layer.rotation}
        text={layer.text}
        width={layer.width}
        wrap="word"
        x={layer.x}
        y={layer.y}
      />
      {isSelected ? (
        <Transformer
          anchorCornerRadius={999}
          anchorFill="#f97316"
          anchorSize={11}
          borderDash={[4, 4]}
          borderStroke="#ea580c"
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          ref={transformerRef}
          rotateAnchorOffset={20}
        />
      ) : null}
    </>
  );
}

function MugPreview3D({spec, textureUrl}: {spec: MugSpec; textureUrl: string}) {
  const texture = useMemo(() => {
    if (!textureUrl) {
      return null;
    }

    const loadedTexture = new THREE.TextureLoader().load(textureUrl);
    loadedTexture.colorSpace = THREE.SRGBColorSpace;
    loadedTexture.wrapS = THREE.RepeatWrapping;
    loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
    loadedTexture.anisotropy = 8;
    return loadedTexture;
  }, [textureUrl]);

  useEffect(() => () => texture?.dispose(), [texture]);

  const wallThickness = 0.08;
  const mugModelSource = resolveAssetSource(process.env.NEXT_PUBLIC_MUG_MODEL_URL?.trim() || 'models/11oz-Mug.fbx');
  const mugModelFormat =
    (process.env.NEXT_PUBLIC_MUG_MODEL_FORMAT?.trim().toLowerCase() as MugModelFormat | undefined) ??
    inferMugModelFormat(mugModelSource);
  const mugModelScale = Number(process.env.NEXT_PUBLIC_MUG_MODEL_SCALE ?? '1');
  const mugModelRotationY = Number(process.env.NEXT_PUBLIC_MUG_MODEL_ROTATION_Y ?? String(Math.PI));
  const mugModelOffsetY = Number(process.env.NEXT_PUBLIC_MUG_MODEL_OFFSET_Y ?? '0');
  const bottomArtSource = resolveAssetSource(process.env.NEXT_PUBLIC_MUG_BOTTOM_ART?.trim());
  const bottomArtRadius = Number(process.env.NEXT_PUBLIC_MUG_BOTTOM_ART_RADIUS ?? String(spec.radiusBottom * 0.55));
  const bottomArtY = Number(process.env.NEXT_PUBLIC_MUG_BOTTOM_ART_Y ?? String(-spec.bodyHeight / 2 - 0.003));

  const bottomArtTexture = useMemo(() => {
    if (!bottomArtSource) {
      return null;
    }

    const loadedTexture = new THREE.TextureLoader().load(bottomArtSource);
    loadedTexture.colorSpace = THREE.SRGBColorSpace;
    return loadedTexture;
  }, [bottomArtSource]);

  useEffect(() => () => bottomArtTexture?.dispose(), [bottomArtTexture]);

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: spec.bodyColor,
        roughness: 0.35,
        metalness: 0.04,
        map: texture ?? undefined
      }),
    [spec.bodyColor, texture]
  );

  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: spec.accentColor ?? spec.bodyColor,
        roughness: 0.4,
        metalness: 0.04
      }),
    [spec.accentColor, spec.bodyColor]
  );

  const innerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#fffefb',
        roughness: 0.45,
        metalness: 0.02,
        side: THREE.BackSide
      }),
    []
  );

  useEffect(() => {
    return () => {
      bodyMaterial.dispose();
      accentMaterial.dispose();
      innerMaterial.dispose();
    };
  }, [accentMaterial, bodyMaterial, innerMaterial]);

  return (
    <group scale={spec.previewScale}>
      {mugModelSource && mugModelFormat ? (
        <ConfiguredMugModel
          format={mugModelFormat}
          offsetY={mugModelOffsetY}
          rotationY={mugModelRotationY}
          scale={mugModelScale}
          spec={spec}
          src={mugModelSource}
          texture={texture}
        />
      ) : (
        <>
          <mesh material={bodyMaterial}>
            <cylinderGeometry args={[spec.radiusTop, spec.radiusBottom, spec.bodyHeight, 96, 1, true]} />
          </mesh>
          <mesh material={innerMaterial} position={[0, -0.01, 0]}>
            <cylinderGeometry
              args={[
                spec.radiusTop - wallThickness,
                spec.radiusBottom - wallThickness,
                spec.bodyHeight - wallThickness * 1.4,
                96,
                1,
                true
              ]}
            />
          </mesh>
          <mesh material={accentMaterial} position={[0, spec.bodyHeight / 2 + 0.01, 0]}>
            <torusGeometry args={[spec.radiusTop - wallThickness / 2, wallThickness / 2, 18, 72]} />
          </mesh>
          <mesh
            material={accentMaterial}
            position={[0, -spec.bodyHeight / 2, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[spec.radiusBottom, 72]} />
          </mesh>
          <mesh
            material={innerMaterial}
            position={[0, -spec.bodyHeight / 2 + wallThickness, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[spec.radiusBottom - wallThickness * 1.15, 72]} />
          </mesh>
          <mesh material={accentMaterial} position={[spec.radiusTop - 0.02, -0.02, 0]}>
            <tubeGeometry
              args={[
                new THREE.CatmullRomCurve3([
                  new THREE.Vector3(0.02, 0.62, 0),
                  new THREE.Vector3(0.26, 0.56, 0),
                  new THREE.Vector3(0.42, 0.24, 0),
                  new THREE.Vector3(0.46, 0, 0),
                  new THREE.Vector3(0.42, -0.24, 0),
                  new THREE.Vector3(0.26, -0.56, 0),
                  new THREE.Vector3(0.02, -0.62, 0)
                ]),
                64,
                0.13,
                20,
                false
              ]}
            />
          </mesh>
          {spec.spoon ? (
            <group position={[spec.radiusTop + 0.56, 0.38, 0.02]} rotation={[0.15, 0.1, -0.1]}>
              <mesh material={accentMaterial}>
                <cylinderGeometry args={[0.035, 0.035, 1.35, 16]} />
              </mesh>
              <mesh material={accentMaterial} position={[0, 0.72, 0]}>
                <sphereGeometry args={[0.12, 18, 18]} />
              </mesh>
            </group>
          ) : null}
        </>
      )}
      {bottomArtTexture ? (
        <mesh position={[0, bottomArtY, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[bottomArtRadius, 72]} />
          <meshStandardMaterial map={bottomArtTexture} roughness={0.42} transparent />
        </mesh>
      ) : null}
      <mesh position={[0, -spec.bodyHeight / 2 - 1.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.8, 64]} />
        <meshStandardMaterial color="#fed7aa" opacity={0.34} transparent />
      </mesh>
    </group>
  );
}

function ConfiguredMugModel({
  src,
  format,
  texture,
  spec,
  scale,
  rotationY,
  offsetY
}: {
  src: string;
  format: MugModelFormat;
  texture: THREE.Texture | null;
  spec: MugSpec;
  scale: number;
  rotationY: number;
  offsetY: number;
}) {
  if (format === 'glb' || format === 'gltf') {
    return (
      <LoadedGltfMugModel
        offsetY={offsetY}
        rotationY={rotationY}
        scale={scale}
        spec={spec}
        src={src}
        texture={texture}
      />
    );
  }

  if (format === 'fbx') {
    return (
      <LoadedFbxMugModel
        offsetY={offsetY}
        rotationY={rotationY}
        scale={scale}
        spec={spec}
        src={src}
        texture={texture}
      />
    );
  }

  return (
    <LoadedObjMugModel
      offsetY={offsetY}
      rotationY={rotationY}
      scale={scale}
      spec={spec}
      src={src}
      texture={texture}
    />
  );
}

function fitImportedMugModel(root: THREE.Object3D, spec: MugSpec, scaleMultiplier: number, offsetY: number) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());

  if (size.y <= 0) {
    return;
  }

  const targetHeight = spec.bodyHeight;
  const normalizedScale = (targetHeight / size.y) * scaleMultiplier;

  root.scale.setScalar(normalizedScale);

  const scaledBox = new THREE.Box3().setFromObject(root);
  const scaledSize = scaledBox.getSize(new THREE.Vector3());
  const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

  root.position.set(
    -scaledCenter.x,
    -scaledBox.min.y - scaledSize.y / 2 + offsetY,
    -scaledCenter.z
  );
}

function applyTextureToMugModel(root: THREE.Object3D, texture: THREE.Texture | null, bodyColor: string) {
  let largestMesh: THREE.Mesh | null = null;
  let largestVolume = -1;

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.geometry.computeBoundingBox();
    const box = child.geometry.boundingBox;

    if (!box) {
      return;
    }

    const size = box.getSize(new THREE.Vector3());
    const volume = size.x * size.y * size.z;

    if (volume > largestVolume) {
      largestVolume = volume;
      largestMesh = child;
    }
  });

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    const isBody = child === largestMesh;
    child.material = new THREE.MeshStandardMaterial({
      color: isBody ? bodyColor : '#fffefb',
      roughness: isBody ? 0.35 : 0.4,
      metalness: 0.04,
      ...(isBody && texture ? {map: texture} : {})
    });
    child.castShadow = false;
    child.receiveShadow = false;
  });
}

function LoadedGltfMugModel({
  src,
  texture,
  spec,
  scale,
  rotationY,
  offsetY
}: {
  src: string;
  texture: THREE.Texture | null;
  spec: MugSpec;
  scale: number;
  rotationY: number;
  offsetY: number;
}) {
  const gltf = useLoader(GLTFLoader, src);
  const scene = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);
    applyTextureToMugModel(clonedScene, texture, spec.bodyColor);
    fitImportedMugModel(clonedScene, spec, scale, offsetY);
    return clonedScene;
  }, [gltf.scene, offsetY, scale, spec, texture]);

  return <primitive object={scene} rotation={[0, rotationY, 0]} />;
}

function LoadedFbxMugModel({
  src,
  texture,
  spec,
  scale,
  rotationY,
  offsetY
}: {
  src: string;
  texture: THREE.Texture | null;
  spec: MugSpec;
  scale: number;
  rotationY: number;
  offsetY: number;
}) {
  const object = useLoader(FBXLoader, src);
  const scene = useMemo(() => {
    const clonedScene = object.clone(true);
    applyTextureToMugModel(clonedScene, texture, spec.bodyColor);
    fitImportedMugModel(clonedScene, spec, scale, offsetY);
    return clonedScene;
  }, [object, offsetY, scale, spec, texture]);

  return <primitive object={scene} rotation={[0, rotationY, 0]} />;
}

function LoadedObjMugModel({
  src,
  texture,
  spec,
  scale,
  rotationY,
  offsetY
}: {
  src: string;
  texture: THREE.Texture | null;
  spec: MugSpec;
  scale: number;
  rotationY: number;
  offsetY: number;
}) {
  const object = useLoader(OBJLoader, src);
  const scene = useMemo(() => {
    const clonedScene = object.clone(true);
    applyTextureToMugModel(clonedScene, texture, spec.bodyColor);
    fitImportedMugModel(clonedScene, spec, scale, offsetY);
    return clonedScene;
  }, [object, offsetY, scale, spec, texture]);

  return <primitive object={scene} rotation={[0, rotationY, 0]} />;
}

function PreviewCanvas({
  spec,
  textureUrl,
  fullscreen = false
}: {
  spec: MugSpec;
  textureUrl: string;
  fullscreen?: boolean;
}) {
  return (
    <div
      className={[
        'overflow-hidden rounded-[1.5rem] border border-orange-100 bg-[radial-gradient(circle_at_top,_rgba(255,237,213,0.92),_transparent_50%),linear-gradient(180deg,_#fff7ed_0%,_#ffffff_100%)]',
        fullscreen ? 'flex h-full min-h-[60vh] flex-col' : ''
      ].join(' ')}
      data-testid={fullscreen ? 'preview-canvas-fullscreen' : 'preview-canvas'}
    >
      <div className={fullscreen ? 'min-h-0 flex-1' : 'h-[280px] sm:h-[360px]'}>
        <Canvas camera={{position: [0, 0.06, fullscreen ? 5.25 : 5.0], fov: fullscreen ? 33 : 37}}>
          <ambientLight intensity={0.75} />
          <directionalLight intensity={1.1} position={[4, 5, 5]} />
          <Environment preset="studio" />
          <Suspense fallback={null}>
            <Bounds clip fit margin={fullscreen ? 1.08 : 1.28} observe={false}>
              <MugPreview3D spec={spec} textureUrl={textureUrl} />
            </Bounds>
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            maxPolarAngle={Math.PI - 0.2}
            minPolarAngle={0.2}
          />
        </Canvas>
      </div>
    </div>
  );
}

function SpecRow({label, value}: {label: string; value: string}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1rem] bg-white/80 px-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function RangeField({
  label,
  min,
  max,
  step,
  value,
  onChange,
  testId
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  testId?: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-700">
      <span className="flex items-center justify-between gap-3 font-medium">
        <span>{label}</span>
        <span className="text-slate-500">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </span>
      <input
        data-testid={testId}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

function ActionButton({
  label,
  onClick,
  destructive = false,
  testId
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  testId?: string;
}) {
  return (
    <button
      className={[
        'rounded-full px-3 py-2 text-sm font-semibold transition',
        destructive
          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
          : 'bg-white text-slate-700 hover:bg-orange-100'
      ].join(' ')}
      data-testid={testId}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
