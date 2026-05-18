/**
 * @file CreatyParty.tsx
 * @description Página de criação de festa ou local.
 * Permite ao administrador cadastrar um novo local fixo (com horários de funcionamento)
 * ou uma festa/evento (com data, horário, gênero musical e configurações de acesso).
 * Integra o mapa Leaflet para seleção de localização via clique ou busca de endereço.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  BadgeCheck,
  Baby,
  Building2,
  CalendarDays,
  Clock,
  Eye,
  FileText,
  Globe2,
  ImagePlus,
  Lock,
  MapPin,
  Music,
  Navigation,
  PartyPopper,
  Plus,
  Save,
  Search,
  Send,
  ShieldCheck,
  Upload,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import LeafletMap, { MapPlace } from "@/components/LeafletMap";

import { theme } from "@/lib/theme";
import { trpc } from "@/lib/trpc";

/* ================================================== */
/* TIPOS */
/* ================================================== */

/** Modo de criação: festa (eventável) ou local (fixo) */
type CreateMode = "party" | "place";
type OpeningHourField = "enabled" | "open" | "close";
type WeekDayKey = (typeof WEEK_DAYS)[number]["key"];
type OpeningHours = Record<WeekDayKey, { enabled: boolean; open: string; close: string }>;

type AddressFields = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  zipCode: string;
};

/** Estado completo do formulário de criação */
type FormState = {
  /* Campos persistidos no banco de dados */
  name: string;
  address: string;

  lat: number | null;
  lng: number | null;

  category: string;

  description: string;

  imageUrl: string;

  /* Campos específicos de festa */
  genre: string;
  date: string;
  startTime: string;
  endTime: string;

  ageRange: string;

  visibility: "public" | "private";

  capacity: number | null;

  /* Campos auxiliares apenas para a UI (não persistidos diretamente) */
  addressFields: AddressFields;
  confirmedLocation: string;
};

const INITIAL_GENRES = ["Techno", "House", "Trance"];

const WEEK_DAYS = [
  { key: "monday", short: "SEG", label: "Segunda" },
  { key: "tuesday", short: "TER", label: "Terça" },
  { key: "wednesday", short: "QUA", label: "Quarta" },
  { key: "thursday", short: "QUI", label: "Quinta" },
  { key: "friday", short: "SEX", label: "Sexta" },
  { key: "saturday", short: "SÁB", label: "Sábado" },
  { key: "sunday", short: "DOM", label: "Domingo" },
] as const;

const DEFAULT_OPENING_HOURS = WEEK_DAYS.reduce((acc, day) => {
  acc[day.key] = { enabled: true, open: "18:00", close: "02:00" };
  return acc;
}, {} as OpeningHours);

const INITIAL_ADDRESS_FIELDS: AddressFields = {
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  zipCode: "",
};

const INITIAL_FORM: FormState = {
  name: "",

  address: "",

  lat: null,
  lng: null,

  category: "general",

  description: "",

  imageUrl: "",

  genre: "",

  date: "",
  startTime: "",
  endTime: "",

  ageRange: "",

  visibility: "public",

  capacity: null,

  addressFields: INITIAL_ADDRESS_FIELDS,
  confirmedLocation: "",
};

const AGE_OPTIONS = [
  {
    value: "Livre",
    label: "Livre",
    description: "Todas as idades",
    icon: Baby,
  },
  {
    value: "+16",
    label: "+16",
    description: "A partir de 16 anos",
    icon: UserRound,
  },
  {
    value: "+18",
    label: "+18",
    description: "Maiores de idade",
    icon: ShieldCheck,
  },
];

const VISIBILITY_OPTIONS = [
  {
    value: "public",
    label: "Pública",
    description: "Aparece no mapa",
    icon: Globe2,
  },
  {
    value: "private",
    label: "Privada",
    description: "Acesso restrito",
    icon: Lock,
  },
];

const styles = {
  card: "rounded-[28px] border border-white/10 bg-[#050b10]/95 shadow-[0_0_35px_rgba(0,0,0,0.45)]",
  input:
    "min-h-[56px] w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50",
  action:
    "inline-flex min-h-[56px] items-center justify-center gap-3 rounded-2xl px-5 font-bold transition disabled:pointer-events-none disabled:opacity-50",
  focus:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions, fallback: string) {
  if (!value) return fallback;

  return new Intl.DateTimeFormat("pt-BR", options).format(new Date(`${value}T00:00:00`));
}

function normalizeZipCode(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 5) return digits;

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function buildFullAddress(address: AddressFields) {
  const streetAndNumber = [address.street, address.number]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  return [
    streetAndNumber,
    address.neighborhood.trim(),
    address.city.trim(),
    address.zipCode.trim(),
  ]
    .filter(Boolean)
    .join(" - ");
}


export default function CreatePartyOrPlace() {
  const [, setLocation] = useLocation();

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<CreateMode>("party");
  const [genres, setGenres] = useState(INITIAL_GENRES);
  const [isCreatingGenre, setIsCreatingGenre] = useState(false);
  const [newGenre, setNewGenre] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_OPENING_HOURS);

  const createPlace = trpc.places.create.useMutation();

  const isParty = mode === "party";
  const title = isParty ? "Criar festa" : "Adicionar local";
  const subtitle = isParty
    ? "Cadastre uma festa com data, horário e localização"
    : "Cadastre um local fixo com horários de funcionamento";

  const formattedDate = useMemo(
    () =>
      formatDate(
        form.date,
        { weekday: "long", day: "2-digit", month: "long", year: "numeric" },
        "Nenhuma data selecionada"
      ),
    [form.date]
  );

  const dateBadge = useMemo(
    () => formatDate(form.date, { day: "2-digit", month: "short" }, "Selecionar data"),
    [form.date]
  );

  const fullAddress = useMemo(
    () => buildFullAddress(form.addressFields),
    [form.addressFields]
  );

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateAddressField(field: keyof AddressFields, value: string) {
    const safeValue = field === "zipCode" ? normalizeZipCode(value) : value;

    setForm((prev) => {
      const nextAddressFields = {
        ...prev.addressFields,
        [field]: safeValue,
      };

      const nextAddress = buildFullAddress(nextAddressFields);

      return {
        ...prev,
        addressFields: nextAddressFields,
        address: nextAddress,
        confirmedLocation:
          prev.confirmedLocation && prev.confirmedLocation === prev.address
            ? nextAddress
            : prev.confirmedLocation,
      };
    });
  }

  function updateCapacity(value: string) {
    setForm((prev) => ({
      ...prev,
      capacity: value ? Number(value) : null,
    }));
  }

  function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (coverPreview) URL.revokeObjectURL(coverPreview);

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function openDatePicker() {
    const input = dateInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") input.showPicker();
    else input.click();
  }

  function cancelGenreCreation() {
    setIsCreatingGenre(false);
    setNewGenre("");
  }

  function handleCreateGenre() {
    const cleanGenre = newGenre.trim();
    if (!cleanGenre) return;

    const alreadyExists = genres.some((genre) => genre.toLowerCase() === cleanGenre.toLowerCase());

    if (!alreadyExists) setGenres((prev) => [...prev, cleanGenre]);

    updateField("genre", cleanGenre);
    cancelGenreCreation();
  }

  function updateOpeningHour(day: WeekDayKey, field: OpeningHourField, value: boolean | string) {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  async function confirmLocation() {
    try {
      const location = fullAddress.trim();

      if (!location) return;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          location
        )}&format=json&limit=1`
      );

      const data = await response.json();

      if (!data.length) {
        alert("Endereço não encontrado");
        return;
      }

      const result = data[0];

      setForm((prev) => ({
        ...prev,
        confirmedLocation: result.display_name,
        address: result.display_name,
        lat: Number(result.lat),
        lng: Number(result.lon),
      }));
    } catch (error) {
      console.error("Erro ao confirmar localização:", error);
    }
  }

  const mapCenter = useMemo<[number, number] | undefined>(() => {
    if (!form.lat || !form.lng) return undefined;

    return [form.lat, form.lng];
  }, [form.lat, form.lng]);

  const previewPlace = useMemo<MapPlace[]>(() => {
    if (!form.lat || !form.lng) return [];

    return [
      {
        id: -1,
        name: form.name || "Novo local",
        lat: form.lat,
        lng: form.lng,
        category: isParty ? form.genre || "party" : form.category,
        address: form.confirmedLocation || form.address || fullAddress,
      },
    ];
  }, [
    form.address,
    form.category,
    form.confirmedLocation,
    form.genre,
    form.lat,
    form.lng,
    form.name,
    fullAddress,
    isParty,
  ]);

  async function handlePublish() {
    try {
      const payload = {
        type: mode,
        name: form.name,
        address: form.address || fullAddress,
        lat: (form.lat ?? 0).toString(),
        lng: (form.lng ?? 0).toString(),
        category: mode === "party" ? form.genre || "party" : form.category,
        description: form.description,
        imageUrl: form.imageUrl,
      };

      console.log("ENVIANDO:", payload);

      const result = await createPlace.mutateAsync(payload);

      console.log("CRIADO:", result);

      setLocation("/admin");
    } catch (error) {
      console.error("ERRO:", error);
    }
  }

  function handleSaveDraft() {
    console.log("Salvar rascunho", { mode, form, openingHours, coverFile });
  }

  return (
    <div className="min-h-screen overflow-y-auto px-4 py-5 md:px-8 md:py-7" style={{ background: theme.colors.background }}>
      <div className="mx-auto max-w-6xl pb-10">
        <Header title={title} subtitle={subtitle} onBack={() => setLocation("/admin")} />

        <section className={cx(styles.card, "mb-5 p-3")}>
          <div className="grid gap-3 md:grid-cols-2">
            <ModeButton
              active={isParty}
              icon={<PartyPopper size={24} />}
              title="Adicionar festa"
              description="Evento com data, início e final"
              onClick={() => setMode("party")}
            />
            <ModeButton
              active={!isParty}
              icon={<Building2 size={24} />}
              title="Adicionar local"
              description="Local fixo com funcionamento semanal"
              onClick={() => setMode("place")}
            />
          </div>
        </section>

        <CoverPicker
          isParty={isParty}
          dateBadge={dateBadge}
          coverPreview={coverPreview}
          inputRef={imageInputRef}
          onChange={handleCoverChange}
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(330px,0.9fr)]">
          <main className="space-y-5">
            <Panel title="Informações principais">
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <Field label={isParty ? "Nome da festa" : "Nome do local"} icon={<BadgeCheck size={21} />}>
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className={styles.input}
                    placeholder={isParty ? "Ex: Neon Pulse" : "Ex: Warehouse 21"}
                  />
                </Field>

                <Field label={isParty ? "Gênero" : "Categoria musical"} icon={<Music size={21} />}>
                  <GenreSelector
                    genres={genres}
                    selectedGenre={form.genre}
                    isCreating={isCreatingGenre}
                    newGenre={newGenre}
                    onSelect={(genre) => updateField("genre", genre)}
                    onStartCreating={() => setIsCreatingGenre(true)}
                    onNewGenreChange={setNewGenre}
                    onCreate={handleCreateGenre}
                    onCancel={cancelGenreCreation}
                  />
                </Field>
              </div>
            </Panel>

            <Panel title={isParty ? "Data e horário da festa" : "Funcionamento do local"}>
              {isParty ? (
                <PartySchedule
                  formattedDate={formattedDate}
                  dateInputRef={dateInputRef}
                  date={form.date}
                  startTime={form.startTime}
                  endTime={form.endTime}
                  onOpenDatePicker={openDatePicker}
                  onChange={updateField}
                />
              ) : (
                <OpeningHoursEditor openingHours={openingHours} onChange={updateOpeningHour} />
              )}
            </Panel>

            <Panel title="Detalhes">
              <div className="space-y-5">
                <Field label="Faixa etária" icon={<ShieldCheck size={21} />}>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {AGE_OPTIONS.map((option) => (
                      <HighlightOption
                        key={option.value}
                        active={form.ageRange === option.value}
                        icon={<option.icon size={22} />}
                        label={option.label}
                        description={option.description}
                        onClick={() => updateField("ageRange", option.value)}
                      />
                    ))}
                  </div>
                </Field>

                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]">
                  <Field label="Visibilidade" icon={<Eye size={21} />}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {VISIBILITY_OPTIONS.map((option) => (
                        <HighlightOption
                          key={option.value}
                          active={form.visibility === option.value}
                          icon={<option.icon size={22} />}
                          label={option.label}
                          description={option.description}
                          onClick={() => updateField("visibility", option.value)}
                        />
                      ))}
                    </div>
                  </Field>

                  <Field label="Capacidade" icon={<UsersRound size={21} />}>
                    <div className={cx(styles.input, "flex items-center gap-3")}>
                      <input
                        value={form.capacity ?? ""}
                        onChange={(event) => updateCapacity(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/30"
                        placeholder="800"
                        inputMode="numeric"
                      />
                      <span className="shrink-0 text-white/45">pessoas</span>
                    </div>
                  </Field>
                </div>

                <Field label="Descrição" icon={<FileText size={21} />}>
                  <textarea
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    rows={4}
                    className={cx(styles.input, "resize-none py-4 leading-relaxed")}
                    placeholder={
                      isParty
                        ? "Descreva a experiência da festa..."
                        : "Descreva o local, ambiente, música e diferenciais..."
                    }
                  />
                </Field>
              </div>
            </Panel>
          </main>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <Panel title="Endereço e mapa">
              <LocationEditor
                addressFields={form.addressFields}
                fullAddress={fullAddress}
                confirmedLocation={form.confirmedLocation}
                previewPlace={previewPlace}
                mapCenter={mapCenter}
                onAddressFieldChange={updateAddressField}
                onConfirm={confirmLocation}
              />
            </Panel>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <PrimaryAction onClick={handlePublish} icon={<Send size={24} />}>
                {isParty ? "Publicar festa" : "Publicar local"}
              </PrimaryAction>
              <SecondaryAction onClick={handleSaveDraft} icon={<Save size={24} />}>
                Salvar rascunho
              </SecondaryAction>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Header({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return (
    <header className="mb-7 flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-4 md:gap-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className={cx(
            styles.focus,
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/75 transition hover:border-emerald-400 hover:text-emerald-400 hover:shadow-[0_0_22px_rgba(0,255,100,0.25)] md:h-14 md:w-14"
          )}
        >
          <ArrowLeft size={26} />
        </button>

        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55 md:text-lg">{subtitle}</p>
        </div>
      </div>

      <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full border border-emerald-400 bg-emerald-500/10 text-lg font-bold text-emerald-400 shadow-[0_0_28px_rgba(0,255,100,0.45)] md:flex">
        ADM
      </div>
    </header>
  );
}

function CoverPicker({
  isParty,
  dateBadge,
  coverPreview,
  inputRef,
  onChange,
}: {
  isParty: boolean;
  dateBadge: string;
  coverPreview: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className="relative mb-5 h-64 overflow-hidden rounded-[30px] border border-emerald-500/70 bg-black shadow-[0_0_40px_rgba(0,255,100,0.16)] md:h-72 md:rounded-[34px]">
      {coverPreview ? (
        <img src={coverPreview} alt="Imagem selecionada" className="absolute inset-0 h-full w-full object-cover opacity-75" />
      ) : (
        <div className="absolute inset-0 bg-[url('/party-cover.jpg')] bg-cover bg-center opacity-45" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-emerald-500/10" />

      {isParty && (
        <div className="absolute left-4 top-4 rounded-2xl border border-emerald-400/70 bg-black/65 px-4 py-3 shadow-[0_0_20px_rgba(0,255,100,0.22)] backdrop-blur md:left-5 md:top-5 md:px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">Data da festa</p>
          <p className="mt-1 text-lg font-bold capitalize text-white md:text-xl">{dateBadge}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cx(styles.focus, "absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 text-white")}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400 bg-black/50 text-emerald-400 shadow-[0_0_34px_rgba(0,255,100,0.55)] backdrop-blur md:h-20 md:w-20">
          {coverPreview ? <Upload size={34} /> : <ImagePlus size={34} />}
        </div>
        <span className="text-lg font-semibold md:text-xl">{coverPreview ? "Trocar imagem" : "Adicionar imagem"}</span>
        <span className="text-sm text-white/50">PNG, JPG ou WEBP</span>
      </button>

      <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
    </section>
  );
}

function GenreSelector({
  genres,
  selectedGenre,
  isCreating,
  newGenre,
  onSelect,
  onStartCreating,
  onNewGenreChange,
  onCreate,
  onCancel,
}: {
  genres: string[];
  selectedGenre: string;
  isCreating: boolean;
  newGenre: string;
  onSelect: (genre: string) => void;
  onStartCreating: () => void;
  onNewGenreChange: (value: string) => void;
  onCreate: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {genres.map((genre) => (
          <NeonChip key={genre} active={selectedGenre === genre} onClick={() => onSelect(genre)}>
            {genre}
          </NeonChip>
        ))}

        <button
          type="button"
          onClick={onStartCreating}
          className={cx(styles.focus, "flex items-center gap-2 rounded-2xl border border-dashed border-emerald-400/70 bg-emerald-400/5 px-5 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-400 hover:text-black")}
        >
          <Plus size={17} />
          Novo
        </button>
      </div>

      {isCreating && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-400/30 bg-black/35 p-3 sm:flex-row">
          <input
            value={newGenre}
            onChange={(event) => onNewGenreChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onCreate();
              if (event.key === "Escape") onCancel();
            }}
            className="min-h-[44px] min-w-0 flex-1 bg-transparent px-2 text-white outline-none placeholder:text-white/35"
            placeholder="Ex: Funk, Rock, Pop..."
            autoFocus
          />
          <button type="button" onClick={onCreate} className={cx(styles.focus, "rounded-xl bg-emerald-400 px-4 py-2 font-bold text-black")}>
            Criar
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancelar criação de gênero"
            className={cx(styles.focus, "rounded-xl border border-white/10 px-3 py-2 text-white/60 transition hover:border-red-400/60 hover:text-red-400")}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function PartySchedule({
  formattedDate,
  dateInputRef,
  date,
  startTime,
  endTime,
  onOpenDatePicker,
  onChange,
}: {
  formattedDate: string;
  dateInputRef: React.RefObject<HTMLInputElement | null>;
  date: string;
  startTime: string;
  endTime: string;
  onOpenDatePicker: () => void;
  onChange: (field: keyof FormState, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-emerald-400/25 bg-emerald-400/10 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Data selecionada</p>
            <p className="mt-1 text-xl font-bold capitalize text-white md:text-2xl">{formattedDate}</p>
          </div>
          <button
            type="button"
            onClick={onOpenDatePicker}
            className={cx(styles.action, styles.focus, "border border-emerald-400 bg-black/40 text-emerald-400 hover:bg-emerald-400 hover:text-black")}
          >
            <CalendarDays size={20} />
            Alterar
          </button>
        </div>

        <input ref={dateInputRef} type="date" value={date} onChange={(event) => onChange("date", event.target.value)} className="sr-only" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Horário de início" icon={<Clock size={21} />}>
          <input type="time" value={startTime} onChange={(event) => onChange("startTime", event.target.value)} className={styles.input} />
        </Field>
        <Field label="Horário de final" icon={<Clock size={21} />}>
          <input type="time" value={endTime} onChange={(event) => onChange("endTime", event.target.value)} className={styles.input} />
        </Field>
      </div>
    </div>
  );
}

function OpeningHoursEditor({
  openingHours,
  onChange,
}: {
  openingHours: OpeningHours;
  onChange: (day: WeekDayKey, field: OpeningHourField, value: boolean | string) => void;
}) {
  return (
    <div className="space-y-3">
      {WEEK_DAYS.map((day) => {
        const currentDay = openingHours[day.key];

        return (
          <OpeningHourRow
            key={day.key}
            short={day.short}
            label={day.label}
            enabled={currentDay.enabled}
            open={currentDay.open}
            close={currentDay.close}
            onToggle={() => onChange(day.key, "enabled", !currentDay.enabled)}
            onOpenChange={(value) => onChange(day.key, "open", value)}
            onCloseChange={(value) => onChange(day.key, "close", value)}
          />
        );
      })}
    </div>
  );
}

function LocationEditor({
  addressFields,
  fullAddress,
  confirmedLocation,
  previewPlace,
  mapCenter,
  onAddressFieldChange,
  onConfirm,
}: {
  addressFields: AddressFields;
  fullAddress: string;
  confirmedLocation: string;

  previewPlace: MapPlace[];

  mapCenter?: [number, number];

  onAddressFieldChange: (
    field: keyof AddressFields,
    value: string
  ) => void;

  onConfirm: () => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Endereço da festa/local" icon={<MapPin size={21} />}>
        <div className="grid gap-3">
          <input
            value={addressFields.street}
            onChange={(event) => onAddressFieldChange("street", event.target.value)}
            className={styles.input}
            placeholder="Rua"
            autoComplete="address-line1"
          />

          <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
            <input
              value={addressFields.number}
              onChange={(event) => onAddressFieldChange("number", event.target.value)}
              className={styles.input}
              placeholder="Número"
              inputMode="numeric"
              autoComplete="address-line2"
            />

            <input
              value={addressFields.neighborhood}
              onChange={(event) => onAddressFieldChange("neighborhood", event.target.value)}
              className={styles.input}
              placeholder="Bairro"
              autoComplete="address-level3"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
            <input
              value={addressFields.city}
              onChange={(event) => onAddressFieldChange("city", event.target.value)}
              className={styles.input}
              placeholder="Cidade"
              autoComplete="address-level2"
            />

            <input
              value={addressFields.zipCode}
              onChange={(event) => onAddressFieldChange("zipCode", event.target.value)}
              className={styles.input}
              placeholder="CEP"
              inputMode="numeric"
              autoComplete="postal-code"
            />
          </div>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!fullAddress}
            className={cx(styles.action, styles.focus, "w-full border border-emerald-400 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400 hover:text-black hover:shadow-[0_0_22px_rgba(0,255,100,0.45)]")}
          >
            <Search size={20} />
            Confirmar localização
          </button>
        </div>
      </Field>

      <div className="h-72 overflow-hidden rounded-[28px] border border-white/10">
      	<LeafletMap
      		places={previewPlace}
      		center={mapCenter}
      		zoom={16}
      		showUserLocation={false}
      		className="h-full w-full"
      	/>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex items-start gap-3">
          <Navigation className="mt-0.5 shrink-0 text-emerald-400" size={20} />
          <div className="min-w-0">
            <p className="font-semibold text-white">Localização atual</p>
            <p className="mt-1 break-words text-sm text-white/45">
              {confirmedLocation || fullAddress || "Nenhum endereço informado ainda."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={cx(styles.card, "p-4 md:p-5")}>
      <h2 className="mb-5 text-xl font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function ModeButton({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        styles.focus,
        "flex min-h-[108px] items-center gap-4 rounded-3xl border p-4 text-left transition md:p-5",
        active
          ? "border-emerald-400 bg-emerald-400/12 shadow-[0_0_28px_rgba(0,255,100,0.28)]"
          : "border-white/10 bg-black/30 hover:border-emerald-400/50"
      )}
    >
      <div
        className={cx(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition",
          active ? "border-emerald-400 bg-emerald-400 text-black" : "border-white/10 bg-black/40 text-emerald-400"
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className={cx("text-lg font-bold", active ? "text-emerald-400" : "text-white")}>{title}</h3>
        <p className="mt-1 text-sm text-white/45">{description}</p>
      </div>
    </button>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center gap-3 text-base font-semibold text-white/70">
        <span className="shrink-0 text-emerald-400 drop-shadow-[0_0_8px_rgba(0,255,100,0.45)]">{icon}</span>
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

function NeonChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        styles.focus,
        "rounded-2xl border px-5 py-3 text-sm font-bold transition",
        active
          ? "border-emerald-400 bg-emerald-400/12 text-emerald-400 shadow-[0_0_22px_rgba(0,255,100,0.36)]"
          : "border-white/10 bg-black/30 text-white/70 hover:border-emerald-400/70 hover:text-emerald-400"
      )}
    >
      {children}
    </button>
  );
}

function HighlightOption({
  active,
  icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        styles.focus,
        "group flex min-h-[92px] items-center gap-4 rounded-2xl border p-4 text-left transition",
        active
          ? "border-emerald-400 bg-emerald-400/12 shadow-[0_0_26px_rgba(0,255,100,0.28)]"
          : "border-white/10 bg-black/25 hover:border-emerald-400/60 hover:bg-emerald-400/5"
      )}
    >
      <div
        className={cx(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition",
          active
            ? "border-emerald-400 bg-emerald-400 text-black"
            : "border-white/10 bg-black/40 text-emerald-400 group-hover:border-emerald-400"
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className={cx("text-lg font-bold", active ? "text-emerald-400" : "text-white")}>{label}</h3>
        <p className="mt-1 text-sm text-white/45">{description}</p>
      </div>
    </button>
  );
}

function OpeningHourRow({
  short,
  label,
  enabled,
  open,
  close,
  onToggle,
  onOpenChange,
  onCloseChange,
}: {
  short: string;
  label: string;
  enabled: boolean;
  open: string;
  close: string;
  onToggle: () => void;
  onOpenChange: (value: string) => void;
  onCloseChange: (value: string) => void;
}) {
  return (
    <div
      className={cx(
        "grid items-center gap-3 rounded-[24px] border p-4 transition md:grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)_108px]",
        enabled ? "border-emerald-400/25 bg-emerald-400/10" : "border-white/10 bg-black/25 opacity-65"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-black",
            enabled ? "border-emerald-400 bg-emerald-400 text-black" : "border-white/10 bg-black/40 text-white/35"
          )}
        >
          {short}
        </div>
        <span className="font-semibold text-white md:hidden">{label}</span>
      </div>

      <input type="time" disabled={!enabled} value={open} onChange={(event) => onOpenChange(event.target.value)} className={styles.input} aria-label={`Abertura ${label}`} />
      <input type="time" disabled={!enabled} value={close} onChange={(event) => onCloseChange(event.target.value)} className={styles.input} aria-label={`Fechamento ${label}`} />

      <button
        type="button"
        onClick={onToggle}
        className={cx(
          styles.action,
          styles.focus,
          "w-full border px-4",
          enabled ? "border-emerald-400 bg-emerald-400/10 text-emerald-400" : "border-white/10 bg-black/35 text-white/40"
        )}
      >
        {enabled ? "Aberto" : "Fechado"}
      </button>
    </div>
  );
}

function PrimaryAction({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(styles.focus, "flex w-full items-center justify-center gap-4 rounded-3xl bg-emerald-400 px-6 py-5 text-lg font-bold text-black shadow-[0_0_34px_rgba(0,255,100,0.48)] transition hover:scale-[1.01] hover:bg-emerald-300 md:text-xl")}
    >
      {icon}
      {children}
    </button>
  );
}

function SecondaryAction({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(styles.focus, "flex w-full items-center justify-center gap-4 rounded-3xl border border-emerald-400 bg-black/30 px-6 py-5 text-lg font-bold text-emerald-400 transition hover:bg-emerald-400/10 hover:shadow-[0_0_24px_rgba(0,255,100,0.22)] md:text-xl")}
    >
      {icon}
      {children}
    </button>
  );
}