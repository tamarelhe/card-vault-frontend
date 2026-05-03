'use client';

import { useEffect, useRef, useState } from 'react';
import { IconChevronDown, IconFilter, IconSearch } from '@/components/icons';

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface PanelFilters {
  q: string;
  set_code: string;
  collector_number: string;
  card_type: string;
  rarity: string;
  mana_cost: string;
  mana_cost_op: 'eq' | 'lt' | 'gt' | 'lte' | 'gte';
  power: string;
  power_op: 'eq' | 'lt' | 'gt' | 'lte' | 'gte';
  toughness: string;
  toughness_op: 'eq' | 'lt' | 'gt' | 'lte' | 'gte';
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

export const EMPTY_PANEL: PanelFilters = {
  q: '', set_code: '', collector_number: '',
  card_type: '', rarity: '',
  mana_cost: '', mana_cost_op: 'eq',
  power: '', power_op: 'eq',
  toughness: '', toughness_op: 'eq',
  sort_by: 'name', sort_order: 'asc',
};

export interface ColorFilterState {
  colors: string[];
  mode: string;
}

export const EMPTY_COLOR_FILTER: ColorFilterState = { colors: [], mode: 'including' };

// ─── Constants ────────────────────────────────────────────────────────────────

const RARITIES = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus'];

const OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
];

const MTG_TYPES = [
  'Artifact', 'Battle', 'Conspiracy', 'Creature', 'Dungeon', 'Emblem',
  'Enchantment', 'Instant', 'Land', 'Phenomenon', 'Plane', 'Planeswalker',
  'Scheme', 'Sorcery', 'Tribal', 'Vanguard',
  'Basic', 'Legendary', 'Snow', 'World', 'Ongoing',
  'Angel', 'Archer', 'Artificer', 'Assassin', 'Bear', 'Beast', 'Bird',
  'Cleric', 'Construct', 'Demon', 'Devil', 'Dragon', 'Drake', 'Druid',
  'Dwarf', 'Elf', 'Faerie', 'Fungus', 'Giant', 'Gnome', 'Goblin', 'Golem',
  'Horror', 'Human', 'Hydra', 'Illusion', 'Insect', 'Knight', 'Merfolk',
  'Monk', 'Nightmare', 'Ninja', 'Noble', 'Ogre', 'Orc', 'Phoenix',
  'Pirate', 'Plant', 'Rogue', 'Salamander', 'Samurai', 'Scout', 'Shaman',
  'Skeleton', 'Sliver', 'Soldier', 'Sphinx', 'Spirit', 'Treefolk',
  'Unicorn', 'Vampire', 'Vedalken', 'Warrior', 'Witch', 'Wizard', 'Wolf',
  'Wurm', 'Zombie',
  'Cave', 'Desert', 'Forest', 'Gate', 'Island', 'Mountain', 'Plains', 'Swamp',
  'Clue', 'Equipment', 'Food', 'Gold', 'Treasure', 'Vehicle',
  'Aura', 'Background', 'Curse', 'Role', 'Rune', 'Saga', 'Shard', 'Shrine',
  'Adventure', 'Lesson', 'Trap',
];

const MTG_COLORS = [
  { code: 'W', label: 'White' },
  { code: 'U', label: 'Blue' },
  { code: 'B', label: 'Black' },
  { code: 'R', label: 'Red' },
  { code: 'G', label: 'Green' },
  { code: 'C', label: 'Colorless' },
];

const COLOR_MODES = [
  { value: 'including', label: 'Including these' },
  { value: 'exact',     label: 'Exact these' },
  { value: 'atmost',    label: 'At most these' },
  { value: 'commander', label: 'Commander Colors' },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

export const inputCls =
  'w-full rounded-lg border border-cv-border bg-cv-surface px-2.5 py-[3px] text-sm text-white placeholder:text-cv-neutral focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30';

export const selectCls =
  'w-full rounded-lg border border-cv-border bg-cv-surface px-2.5 py-[3px] text-sm text-white focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30';

// ─── CardFilterPanel ──────────────────────────────────────────────────────────

export interface CardFilterPanelProps {
  filters: PanelFilters;
  colorFilter?: ColorFilterState;
  extraFilterCount: number;
  onChange: <K extends keyof PanelFilters>(key: K, value: PanelFilters[K]) => void;
  onColorToggle?: (code: string) => void;
  onColorMode?: (mode: string) => void;
  onSearch: (page?: number) => void;
  onReset: () => void;
  sortOptions: { value: string; label: string }[];
  showRarity?: boolean;
  showNumericOps?: boolean;
  showColors?: boolean;
}

export function CardFilterPanel({
  filters,
  colorFilter,
  extraFilterCount,
  onChange,
  onColorToggle,
  onColorMode,
  onSearch,
  onReset,
  sortOptions,
  showRarity = true,
  showNumericOps = true,
  showColors = true,
}: CardFilterPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const hasExtra = extraFilterCount > 0;

  return (
    <div className="rounded-xl border border-cv-border bg-cv-raised">

      {/* ── Row 1: base filters ── */}
      <div className="flex flex-wrap items-end gap-3 p-3">

        <FilterField label="Card Name / Text" className="min-w-44 flex-1">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cv-neutral" />
            <input
              type="text"
              placeholder="e.g. Black Lotus"
              value={filters.q}
              onChange={e => onChange('q', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearch()}
              className={inputCls + ' pl-8'}
            />
          </div>
        </FilterField>

        <FilterField label="Set Code" className="w-28">
          <input
            type="text"
            placeholder="All Sets"
            value={filters.set_code}
            onChange={e => onChange('set_code', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
            className={inputCls}
          />
        </FilterField>

        <FilterField label="Coll #" className="w-24">
          <input
            type="text"
            placeholder="001"
            value={filters.collector_number}
            onChange={e => onChange('collector_number', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
            className={inputCls}
          />
        </FilterField>

        <div className="flex items-end gap-1.5">
          <button
            onClick={() => setExpanded(x => !x)}
            className={[
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              expanded || hasExtra
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-cv-border text-cv-neutral hover:border-white/20 hover:text-white',
            ].join(' ')}
          >
            <IconFilter className="h-3.5 w-3.5" />
            {hasExtra && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-white">
                {extraFilterCount}
              </span>
            )}
            <IconChevronDown
              className={['h-3.5 w-3.5 transition-transform', expanded ? 'rotate-180' : ''].join(' ')}
            />
          </button>

          <button
            onClick={onReset}
            className="rounded-lg border border-cv-border px-3 py-1.5 text-xs font-medium text-cv-neutral transition-colors hover:border-white/20 hover:text-white"
          >
            Clear all
          </button>

          <button
            onClick={() => onSearch()}
            className="rounded-lg border border-transparent bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Apply
          </button>
        </div>
      </div>

      {/* ── Row 2: extra filters ── */}
      {expanded && (
        <div className="flex flex-wrap items-end gap-3 border-t border-cv-border px-3 pb-3 pt-2.5">

          <FilterField label="Type" className="w-44">
            <TypeCombobox value={filters.card_type} onChange={v => onChange('card_type', v)} />
          </FilterField>

          {showRarity && (
            <FilterField label="Rarity" className="w-32">
              <select
                value={filters.rarity}
                onChange={e => onChange('rarity', e.target.value)}
                className={selectCls}
              >
                <option value="">Any</option>
                {RARITIES.map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </FilterField>
          )}

          {showNumericOps ? (
            <>
              <NumericFilter
                label="CMC"
                value={filters.mana_cost}
                op={filters.mana_cost_op}
                onValue={v => onChange('mana_cost', v)}
                onOp={v => onChange('mana_cost_op', v as PanelFilters['mana_cost_op'])}
              />
              <NumericFilter
                label="Power"
                value={filters.power}
                op={filters.power_op}
                onValue={v => onChange('power', v)}
                onOp={v => onChange('power_op', v as PanelFilters['power_op'])}
              />
              <NumericFilter
                label="Toughness"
                value={filters.toughness}
                op={filters.toughness_op}
                onValue={v => onChange('toughness', v)}
                onOp={v => onChange('toughness_op', v as PanelFilters['toughness_op'])}
              />
            </>
          ) : (
            <>
              <FilterField label="Mana Cost" className="w-28">
                <input type="text" placeholder="{2}{W}" value={filters.mana_cost}
                  onChange={e => onChange('mana_cost', e.target.value)} className={inputCls} />
              </FilterField>
              <FilterField label="Power" className="w-20">
                <input type="text" placeholder="*" value={filters.power}
                  onChange={e => onChange('power', e.target.value)} className={inputCls} />
              </FilterField>
              <FilterField label="Toughness" className="w-20">
                <input type="text" placeholder="*" value={filters.toughness}
                  onChange={e => onChange('toughness', e.target.value)} className={inputCls} />
              </FilterField>
            </>
          )}

          <FilterField label="Sort by" className="w-36">
            <select
              value={filters.sort_by}
              onChange={e => onChange('sort_by', e.target.value)}
              className={selectCls}
            >
              {sortOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </FilterField>

          <FilterField label="Order" className="w-28">
            <select
              value={filters.sort_order}
              onChange={e => onChange('sort_order', e.target.value as 'asc' | 'desc')}
              className={selectCls}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </FilterField>

          {showColors && colorFilter && onColorToggle && onColorMode && (
            <ColorFilterControl
              selected={colorFilter.colors}
              mode={colorFilter.mode}
              onToggle={onColorToggle}
              onMode={onColorMode}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── TypeCombobox ─────────────────────────────────────────────────────────────

function TypeCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = value.trim().length === 0
    ? []
    : MTG_TYPES.filter(t => t.toLowerCase().startsWith(value.toLowerCase())).slice(0, 8);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        placeholder="Any Type"
        value={value}
        autoComplete="off"
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => value.trim() && setOpen(true)}
        onKeyDown={e => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter') setOpen(false);
        }}
        className={inputCls}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-cv-border bg-cv-overlay shadow-xl">
          {suggestions.map(type => (
            <li key={type}>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); onChange(type); setOpen(false); }}
                className="w-full px-3 py-1.5 text-left text-sm text-white hover:bg-primary/20 hover:text-primary-light"
              >
                {type}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── FilterField ──────────────────────────────────────────────────────────────

function FilterField({ label, children, className }: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={['flex flex-col gap-1', className].join(' ')}>
      <label className="text-[10px] font-medium uppercase tracking-wide text-cv-neutral">{label}</label>
      {children}
    </div>
  );
}

// ─── NumericFilter ────────────────────────────────────────────────────────────

function NumericFilter({ label, value, op, onValue, onOp }: {
  label: string;
  value: string;
  op: string;
  onValue: (v: string) => void;
  onOp: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium uppercase tracking-wide text-cv-neutral">{label}</label>
      <div className="flex">
        <select
          value={op}
          onChange={e => onOp(e.target.value)}
          className="w-12 flex-shrink-0 rounded-l-lg rounded-r-none border border-cv-border bg-cv-surface px-1 py-[3px] text-xs text-white focus:z-10 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          type="number"
          placeholder="0"
          value={value}
          onChange={e => onValue(e.target.value)}
          className="w-16 rounded-l-none rounded-r-lg border border-l-0 border-cv-border bg-cv-surface px-2 py-[3px] text-xs text-white placeholder:text-cv-neutral focus:z-10 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}

// ─── ColorFilterControl ───────────────────────────────────────────────────────

function ColorFilterControl({ selected, mode, onToggle, onMode }: {
  selected: string[];
  mode: string;
  onToggle: (code: string) => void;
  onMode: (mode: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium uppercase tracking-wide text-cv-neutral">Colors</label>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {MTG_COLORS.map(({ code, label }) => {
            const active = selected.includes(code);
            return (
              <button
                key={code}
                type="button"
                title={label}
                onClick={() => onToggle(code)}
                className={[
                  'h-7 w-7 overflow-hidden rounded-full transition-all duration-150',
                  active ? 'opacity-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.35)]' : 'opacity-25 hover:opacity-55',
                ].join(' ')}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://svgs.scryfall.io/card-symbols/${code}.svg`} alt={label} className="h-full w-full" />
              </button>
            );
          })}
        </div>
        <select
          value={mode}
          onChange={e => onMode(e.target.value)}
          className={selectCls + ' w-40'}
        >
          {COLOR_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
    </div>
  );
}
