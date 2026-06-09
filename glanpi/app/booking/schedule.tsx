import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { SlotOption } from '@/api';
import {
  BookingModalHeader,
  DateStrip,
  StaffSelector,
  TimeSlotGrid,
  type DateStripItemModel,
  type StaffSelectorMember,
  type TimeSlotGridState,
} from '@/components/booking';
import { GBottomBar, GButton, GIconButton, GScreen, GText } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { useAvailability } from '@/hooks/use-availability';
import { useBusinessHours } from '@/hooks/use-business-hours';
import { useMe } from '@/hooks/use-me';
import { usePostBooking } from '@/hooks/use-post-booking';
import { useSalonStaff } from '@/hooks/use-salon-staff';
import { useSlotHold } from '@/hooks/use-slot-hold';
import { track } from '@/lib/analytics';
import {
  buildDateStrip,
  closedDays,
  formatShortDate,
  formatSlotTime,
  monthLabel,
} from '@/lib/datetime';
import { formatDuration, formatPrice } from '@/lib/format';
import { useBookingDraft } from '@/providers/booking-draft-provider';
import { useAppTheme } from '@/theme';

const DATE_COUNT = 14;

/**
 * Booking · Step 2 — Schedule (design §5.2): staff + date + time on one screen.
 * Built as a 3-column slot LegendList with the service summary, staff selector
 * and date strip in the header so the date strip stays interactive while slots
 * reload. The "Dalej" seam (hold + auth fork) follows plan §8.4.
 */
export default function BookingScheduleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { app } = useAppTheme();
  const { draft, set } = useBookingDraft();
  const { status } = useAuth();
  const { data: me } = useMe();
  const slotHold = useSlotHold();

  const salonId = draft.salonId;
  const service = draft.service;

  const { data: postBooking } = usePostBooking(draft.postId ?? '');
  const { data: salonStaff } = useSalonStaff(draft.postId ? undefined : salonId);
  const { data: hours } = useBusinessHours(salonId);

  // --- Staff (prefer the post payload, else the salon staff list) ---
  const recommendedId = postBooking?.recommended_staff?.id;
  const staffMembers = useMemo<StaffSelectorMember[]>(() => {
    if (postBooking?.staff_members?.length) {
      return postBooking.staff_members.map((m) => ({
        id: String(m.id),
        name: m.display_name,
        recommended: recommendedId != null && String(m.id) === String(recommendedId),
      }));
    }
    return (salonStaff ?? []).map((m) => ({ id: String(m.id), name: m.display_name }));
  }, [postBooking?.staff_members, salonStaff, recommendedId]);

  const [staffId, setStaffId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (staffId || staffMembers.length === 0) return;
    const def = recommendedId != null ? String(recommendedId) : staffMembers[0].id;
    setStaffId(def);
  }, [staffMembers, recommendedId, staffId]);

  // --- Dates ---
  const closed = useMemo(() => closedDays(hours), [hours]);
  const dateItems = useMemo<DateStripItemModel[]>(
    () =>
      buildDateStrip(DATE_COUNT, draft.timezone).map((d) => ({
        date: d.date,
        weekday: d.isToday ? 'Dziś' : d.weekdayShort,
        day: d.dayNumber,
        disabled: closed.has(d.dayOfWeek),
        label: `${d.weekdayShort} ${d.dayNumber}`,
      })),
    [closed, draft.timezone],
  );

  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (selectedDate || dateItems.length === 0) return;
    const firstOpen = dateItems.find((d) => !d.disabled);
    if (firstOpen) setSelectedDate(firstOpen.date);
  }, [dateItems, selectedDate]);

  // --- Availability ---
  const availability = useAvailability({
    salon: salonId,
    service: service?.id,
    staff: staffId,
    date: selectedDate,
  });

  const [selectedSlotKey, setSelectedSlotKey] = useState<string | undefined>(undefined);

  // Reset the chosen slot whenever the staff/date changes.
  useEffect(() => {
    setSelectedSlotKey(undefined);
  }, [staffId, selectedDate]);

  const gridState: TimeSlotGridState = !service
    ? 'empty'
    : availability.isLoading
      ? 'loading'
      : availability.isError
        ? 'error'
        : (availability.data?.slot_options.length ?? 0) === 0
          ? 'empty'
          : 'ready';

  const onSelectStaff = (id: string) => {
    setStaffId(id);
    const member = staffMembers.find((m) => m.id === id);
    set({ staffId: id, staffName: member?.name });
  };

  const onSelectSlot = (option: SlotOption) => {
    setSelectedSlotKey(option.start_datetime);
    set({ slot: option, date: selectedDate, staffId, staffName: staffMembers.find((m) => m.id === staffId)?.name });
  };

  const onNext = async () => {
    if (!draft.slot && !selectedSlotKey) return;
    const slot = availability.data?.slot_options.find((s) => s.start_datetime === selectedSlotKey);
    if (!slot) return;

    set({ slot, date: selectedDate, staffId, staffName: staffMembers.find((m) => m.id === staffId)?.name });
    track('slot_select', { date: selectedDate, start_time: slot.display.start_time, staff_id: staffId });

    // Best-effort hold (advisory — create-failure is the real guard, design D3).
    try {
      const hold = await slotHold.mutateAsync(slot.slot_ids);
      set({ hold });
    } catch {
      // ignore — proceed without a hold
    }

    const needsDetails = status !== 'authenticated' || !me?.first_name;
    router.push(needsDetails ? '/booking/details' : '/booking/review');
  };

  const summary =
    selectedDate && selectedSlotKey
      ? `${formatShortDate(selectedDate)} · ${formatSlotTime(
          availability.data?.slot_options.find((s) => s.start_datetime === selectedSlotKey)?.display
            .start_time ?? '',
        )}`
      : undefined;

  const header = (
    <View style={{ gap: app.spacing.lg, paddingTop: app.spacing.sm }}>
      {/* Editable service summary */}
      <View style={[styles.serviceRow, { paddingHorizontal: app.spacing.lg }]}>
        <GText variant="bodyStrong" numberOfLines={1} style={styles.serviceText}>
          {service
            ? [service.name, formatDuration(service.duration_minutes), formatPrice(service.price_display)]
                .filter(Boolean)
                .join(' · ')
            : ''}
        </GText>
        <GIconButton icon="pencil-outline" size={18} onPress={() => router.back()} accessibilityLabel={t('booking.step.service')} />
      </View>

      <View style={{ paddingHorizontal: app.spacing.lg }}>
        <StaffSelector
          title={t('booking.specialist')}
          recommendedLabel={t('booking.recommended')}
          members={staffMembers}
          selectedId={staffId}
          onSelect={onSelectStaff}
        />
      </View>

      {selectedDate && (
        <GText variant="titleSmall" style={{ paddingHorizontal: app.spacing.lg }}>
          {monthLabel(selectedDate, draft.timezone)}
        </GText>
      )}
      <DateStrip items={dateItems} selectedDate={selectedDate} onSelect={setSelectedDate} />
    </View>
  );

  return (
    <GScreen edges={[]} padded={false} tone="background">
      <BookingModalHeader
        title={t('booking.step.schedule')}
        step={1}
        onClose={() => router.dismissAll()}
      />

      <TimeSlotGrid
        options={availability.data?.slot_options ?? []}
        state={gridState}
        selectedKey={selectedSlotKey}
        onSelect={onSelectSlot}
        onRetry={() => availability.refetch()}
        labels={{
          empty: t('booking.slots.empty'),
          emptyHint: t('booking.slots.emptyHint'),
          error: t('booking.slots.error'),
          retry: t('booking.slots.retry'),
        }}
        ListHeaderComponent={header}
      />

      <GBottomBar
        summary={
          summary ? (
            <GText variant="caption" color="muted" numberOfLines={1}>
              {summary}
            </GText>
          ) : undefined
        }
      >
        <GButton
          label={t('booking.next')}
          onPress={onNext}
          loading={slotHold.isPending}
          disabled={!selectedSlotKey}
          fullWidth={!summary}
          testID="booking-schedule-next"
        />
      </GBottomBar>
    </GScreen>
  );
}

const styles = StyleSheet.create({
  serviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  serviceText: { flexShrink: 1 },
});
