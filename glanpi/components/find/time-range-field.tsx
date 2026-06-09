import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { GChip, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

import {
  TIME_STEPS,
  TimeRangeSlider,
  indexToTime,
  timeToIndex,
} from './time-range-slider';

/** Part-of-day presets → [from, to] wall-clock windows (HH:mm). */
const PRESETS = {
  morning: ['06:00', '12:00'],
  afternoon: ['12:00', '17:00'],
  evening: ['17:00', '22:00'],
} as const;

type PresetKey = keyof typeof PRESETS;

export type TimeRangeFieldProps = {
  from: string | undefined; // HH:mm
  to: string | undefined; // HH:mm
  onChange: (next: { from?: string; to?: string }) => void;
};

/**
 * Time-of-day window for the Find filter sheet. A dual-handle range slider over
 * a daypart-labeled track is the primary control; the part-of-day chips are
 * one-tap shortcuts that snap the same handles. The slider and chips are one
 * control, not two competing inputs.
 */
export function TimeRangeField({ from, to, onChange }: TimeRangeFieldProps) {
  const { t } = useTranslation();
  const { app } = useAppTheme();

  const active = Boolean(from || to);
  const fromIndex = from ? timeToIndex(from) : 0;
  const toIndex = to ? timeToIndex(to) : TIME_STEPS;

  const activePreset = (Object.keys(PRESETS) as PresetKey[]).find(
    (k) => PRESETS[k][0] === from && PRESETS[k][1] === to,
  );

  const onPreset = (key: PresetKey) => {
    if (activePreset === key) {
      onChange({ from: undefined, to: undefined });
    } else {
      onChange({ from: PRESETS[key][0], to: PRESETS[key][1] });
    }
  };

  const onSlider = (fi: number, ti: number) =>
    onChange({ from: indexToTime(fi), to: indexToTime(ti) });

  const summary = !active
    ? t('find.filters.anyTime')
    : activePreset
      ? t(`find.filters.partOfDay.${activePreset}`)
      : `${from} – ${to}`;

  return (
    <View style={{ gap: app.spacing.md }}>
      <View style={styles.head}>
        <GText variant="titleSmall">{t('find.filters.timeLabel')}</GText>
        <View style={styles.headRight}>
          <GText variant="caption" color={active ? 'default' : 'muted'}>
            {summary}
          </GText>
          {active && (
            <GText
              variant="caption"
              color="primary"
              onPress={() => onChange({ from: undefined, to: undefined })}
              accessibilityRole="button"
            >
              {t('find.filters.clearTime')}
            </GText>
          )}
        </View>
      </View>

      <TimeRangeSlider
        fromIndex={fromIndex}
        toIndex={toIndex}
        active={active}
        onChange={onSlider}
        zoneLabel={(key) => t(`find.filters.partOfDay.${key}`)}
      />

      <View style={[styles.presets, { gap: app.spacing.sm }]}>
        {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
          <GChip
            key={key}
            label={t(`find.filters.partOfDay.${key}`)}
            selected={activePreset === key}
            onPress={() => onPreset(key)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  presets: { flexDirection: 'row', flexWrap: 'wrap' },
});
